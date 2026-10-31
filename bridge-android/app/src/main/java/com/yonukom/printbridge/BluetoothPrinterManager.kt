package com.yonukom.printbridge

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.UUID
import java.util.concurrent.Callable
import java.util.concurrent.Executors
import java.util.concurrent.ExecutionException
import java.util.concurrent.TimeUnit
import java.util.concurrent.TimeoutException

/**
 * Manages the Bluetooth Classic SPP (RFCOMM) connection to a thermal receipt printer.
 *
 * All blocking socket operations are dispatched onto a single-thread executor so that:
 *  - callers from the NanoHTTPD serving thread / UI thread never touch the socket directly,
 *  - connect / send / disconnect are strictly serialized (no concurrent socket access).
 *
 * Public suspend functions move work off the caller thread via `withContext(Dispatchers.IO)`
 * and then submit the actual blocking call to [ioExecutor].
 */
class BluetoothPrinterManager(private val context: Context) {

    companion object {
        private const val TAG = "BT-Printer"

        /** Standard SPP (Serial Port Profile) UUID used by virtually all ESC/POS thermal printers. */
        val SERIAL_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805f9b34fb")

        /** Hard cap on a single connect() call — Bluetooth sockets can hang on unreachable devices. */
        private const val CONNECT_TIMEOUT_MS = 15_000L
    }

    /** Single background thread for all blocking Bluetooth I/O (serializes socket access). */
    private val ioExecutor = Executors.newSingleThreadExecutor { r ->
        Thread(r, "printbridge-bt-io").apply { isDaemon = true }
    }

    @Volatile
    private var socket: BluetoothSocket? = null

    @Volatile
    private var connectedDevice: BluetoothDevice? = null

    /** Lazily resolve the default BluetoothAdapter via the system BluetoothManager. */
    @SuppressLint("MissingPermission")
    private fun adapter(): BluetoothAdapter? {
        val bm = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
        return bm?.adapter
    }

    /** True iff we currently hold an open BluetoothSocket to a printer. */
    fun isConnected(): Boolean = socket?.isConnected == true

    /** Currently connected printer (name + address) or null. */
    @SuppressLint("MissingPermission")
    fun connectedPrinterInfo(): Pair<String, String>? {
        val dev = connectedDevice ?: return null
        if (!isConnected()) return null
        val name = try { dev.name } catch (_: SecurityException) { null } ?: dev.address
        return name to dev.address
    }

    /** List of bonded (paired) Bluetooth devices (name, mac). Returns empty if BT unavailable. */
    @SuppressLint("MissingPermission")
    fun listPairedPrinters(): List<Pair<String, String>> {
        val ad = adapter() ?: return emptyList()
        // On API 31+, BLUETOOTH_CONNECT must be granted at runtime — caller is responsible.
        val bonded = try {
            ad.bondedDevices ?: emptySet()
        } catch (_: SecurityException) {
            Log.w(TAG, "bondedDevices() denied — BLUETOOTH_CONNECT missing")
            emptySet()
        }
        return bonded.map { d ->
            val name = try { d.name } catch (_: SecurityException) { null } ?: "Unknown"
            name to d.address
        }.sortedBy { it.first.lowercase() }
    }

    /** Bonded devices as JSON: {"printers":[{"address":"...","name":"..."}]} */
    fun listPairedPrintersJson(): String {
        val arr = JSONArray()
        listPairedPrinters().forEach { (name, address) ->
            arr.put(JSONObject().put("address", address).put("name", name))
        }
        return JSONObject().put("printers", arr).toString()
    }

    /**
     * Connect to the given MAC address via RFCOMM/SPP. Runs on [ioExecutor] with a timeout.
     * Returns null on success, an error string on failure.
     */
    private fun connectBlocking(address: String): String? {
        // Tear down any previous socket first.
        disconnectQuiet()

        val ad = adapter() ?: return "Bluetooth indisponible sur cet appareil"
        val device: BluetoothDevice = try {
            ad.getRemoteDevice(address)
        } catch (e: IllegalArgumentException) {
            return "Adresse MAC invalide: $address"
        }

        return try {
            val s = device.createRfcommSocketToServiceRecord(SERIAL_UUID)
            s.connect() // blocking
            socket = s
            connectedDevice = device
            Log.i(TAG, "Connected to ${device.name} @ ${device.address}")
            null
        } catch (e: IOException) {
            "Connexion impossible: ${e.message ?: "I/O error"}"
        } catch (e: SecurityException) {
            "Permission refusée: ${e.message ?: "BLUETOOTH_CONNECT"}"
        }
    }

    /** Suspendable wrapper around [connectBlocking]. Must be called off the main thread. */
    suspend fun connectAsync(address: String): String? = withContext(Dispatchers.IO) {
        val future = ioExecutor.submit(Callable { connectBlocking(address) })
        try {
            future.get(CONNECT_TIMEOUT_MS, TimeUnit.MILLISECONDS)
        } catch (_: TimeoutException) {
            future.cancel(true)
            "Connexion expirée (timeout ${CONNECT_TIMEOUT_MS / 1000}s)"
        } catch (e: ExecutionException) {
            e.cause?.message ?: "Erreur de connexion"
        } catch (_: InterruptedException) {
            future.cancel(true)
            "Connexion interrompue"
        }
    }

    /**
     * Write raw ESC/POS bytes to the connected printer and flush. Runs on [ioExecutor].
     * Returns null on success, an error string on failure.
     */
    private fun sendBlocking(bytes: ByteArray): String? {
        val s = socket ?: return "Aucune imprimante connectée"
        if (!s.isConnected) return "Aucune imprimante connectée"
        return try {
            val out = s.outputStream
            out.write(bytes)
            out.flush()
            Log.i(TAG, "Wrote ${bytes.size} bytes to printer")
            null
        } catch (e: IOException) {
            // The socket is probably dead — drop it so the next /print returns "not connected".
            disconnectQuiet()
            "Erreur d'écriture: ${e.message ?: "I/O error"}"
        } catch (e: SecurityException) {
            "Permission refusée: ${e.message ?: "BLUETOOTH_CONNECT"}"
        }
    }

    /** Suspendable wrapper around [sendBlocking]. */
    suspend fun sendAsync(bytes: ByteArray): String? = withContext(Dispatchers.IO) {
        try {
            ioExecutor.submit(Callable { sendBlocking(bytes) }).get()
        } catch (e: ExecutionException) {
            e.cause?.message ?: "Erreur d'envoi"
        } catch (_: InterruptedException) {
            "Envoi interrompu"
        }
    }

    /** Tear down the current socket, swallowing errors. Safe to call repeatedly. */
    fun disconnectQuiet() {
        val s = socket ?: return
        try {
            if (s.isConnected) {
                try { s.outputStream?.flush() } catch (_: IOException) {}
            }
            s.close()
        } catch (e: IOException) {
            Log.w(TAG, "Error closing socket: ${e.message}")
        } finally {
            socket = null
            connectedDevice = null
        }
    }

    /** Clean shutdown — disconnect + stop the IO executor. */
    fun shutdown() {
        disconnectQuiet()
        ioExecutor.shutdownNow()
    }
}
