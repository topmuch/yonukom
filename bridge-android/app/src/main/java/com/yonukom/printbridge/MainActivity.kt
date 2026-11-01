package com.yonukom.printbridge

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.ListView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * UI for the print bridge:
 *  - permission requests (BLUETOOTH_CONNECT on API 31+, POST_NOTIFICATIONS on API 33+)
 *  - Start / Stop the foreground [PrintService]
 *  - list paired Bluetooth printers and tap one to connect
 *  - show live status ("Pont actif — port 47822" + connected printer name)
 *
 * Listing paired printers works directly against the system BluetoothManager (read-only).
 * Connecting must go through [PrintService.instance]?.btManager so the HttpServer's /print
 * sees the same socket.
 */
class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "MainActivity"
        private const val REQ_PERMS = 0xB001
        private const val POLL_INTERVAL_MS = 1000L
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val handler = Handler(Looper.getMainLooper())

    private lateinit var statusText: TextView
    private lateinit var startBtn: Button
    private lateinit var stopBtn: Button
    private lateinit var refreshBtn: Button
    private lateinit var printersList: ListView
    private lateinit var emptyText: TextView

    private lateinit var printerAdapter: ArrayAdapter<String>
    private val printerEntries = mutableListOf<Pair<String, String>>() // name, address

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        statusText = findViewById(R.id.status_text)
        startBtn = findViewById(R.id.btn_start)
        stopBtn = findViewById(R.id.btn_stop)
        refreshBtn = findViewById(R.id.btn_refresh)
        printersList = findViewById(R.id.printers_list)
        emptyText = findViewById(android.R.id.empty)

        printerAdapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, mutableListOf())
        printersList.adapter = printerAdapter
        printersList.emptyView = emptyText

        startBtn.setOnClickListener {
            requestNeededPermissionsThen {
                val intent = Intent(this, PrintService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(intent)
                } else {
                    startService(intent)
                }
                Toast.makeText(this, "Pont démarré", Toast.LENGTH_SHORT).show()
                // Give the service a beat to come up, then refresh UI.
                handler.postDelayed({ refreshUi() }, 400)
            }
        }

        stopBtn.setOnClickListener {
            stopService(Intent(this, PrintService::class.java))
            Toast.makeText(this, "Pont arrêté", Toast.LENGTH_SHORT).show()
            handler.postDelayed({ refreshUi() }, 200)
        }

        refreshBtn.setOnClickListener { refreshUi() }

        printersList.setOnItemClickListener { _, _, position, _ ->
            val entry = printerEntries.getOrNull(position) ?: return@setOnItemClickListener
            val (name, address) = entry
            val svc = PrintService.instance
            val mgr = svc?.btManager
            if (svc == null || mgr == null) {
                Toast.makeText(this, "Démarrez d'abord le pont", Toast.LENGTH_LONG).show()
                return@setOnItemClickListener
            }
            Toast.makeText(this, "Connexion à $name…", Toast.LENGTH_SHORT).show()
            scope.launch {
                val err = withContext(Dispatchers.IO) { mgr.connectAsync(address) }
                if (err == null) {
                    Toast.makeText(this@MainActivity, "Connecté à $name", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this@MainActivity, err, Toast.LENGTH_LONG).show()
                }
                refreshUi()
            }
        }

        requestNeededPermissionsThen { refreshUi() }
    }

    override fun onResume() {
        super.onResume()
        refreshUi()
        handler.postDelayed(pollTask, POLL_INTERVAL_MS)
    }

    override fun onPause() {
        super.onPause()
        handler.removeCallbacks(pollTask)
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(pollTask)
        scope.coroutineContext[Job]?.cancel()
    }

    // ---------------- permissions ----------------

    private fun neededPermissions(): List<String> {
        val out = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            out.add(Manifest.permission.BLUETOOTH_CONNECT)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            out.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        return out
    }

    private fun hasAllPermissions(): Boolean =
        neededPermissions().all { ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED }

    private fun requestNeededPermissionsThen(onGranted: () -> Unit) {
        val missing = neededPermissions().filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isEmpty()) {
            onGranted()
            return
        }
        // Capture the callback to run after the result comes back.
        pendingOnGranted = onGranted
        ActivityCompat.requestPermissions(this, missing.toTypedArray(), REQ_PERMS)
    }

    private var pendingOnGranted: (() -> Unit)? = null

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != REQ_PERMS) return
        val cb = pendingOnGranted
        pendingOnGranted = null
        if (grantResults.isEmpty()) return
        // We don't hard-block on denial — listing will simply show no devices, connect will fail
        // with a SecurityException that the bridge surfaces as a friendly error.
        if (cb != null) cb() else refreshUi()
        if (!hasAllPermissions()) {
            Toast.makeText(
                this,
                "Permissions Bluetooth requises pour lister/connecter les imprimantes",
                Toast.LENGTH_LONG,
            ).show()
        }
    }

    // ---------------- UI ----------------

    private val pollTask = object : Runnable {
        override fun run() {
            refreshUi()
            handler.postDelayed(this, POLL_INTERVAL_MS)
        }
    }

    @SuppressLint("MissingPermission")
    private fun refreshUi() {
        val running = PrintService.instance?.isRunning == true
        val mgr = PrintService.instance?.btManager
        val info = mgr?.connectedPrinterInfo()

        val status = buildString {
            appendLine("Pont ${if (running) "actif" else "arrêté"} — port 47822")
            if (info != null) {
                append("Imprimante : ").append(info.first)
            } else if (running) {
                append("Aucune imprimante connectée")
            } else {
                append("Touchez « Démarrer le pont »")
            }
        }
        statusText.text = status

        startBtn.isEnabled = !running
        stopBtn.isEnabled = running

        // Populate paired printers list (read-only — works even before the service starts).
        populatePairedPrinters()
    }

    @SuppressLint("MissingPermission")
    private fun populatePairedPrinters() {
        val paired: List<Pair<String, String>> = try {
            bondedDevicesCompat()
        } catch (e: SecurityException) {
            Log.w(TAG, "bondedDevices denied: ${e.message}")
            emptyList()
        }
        printerEntries.clear()
        printerEntries.addAll(paired)
        printerAdapter.clear()
        printerEntries.forEach { (name, _) -> printerAdapter.add(name) }
        printerAdapter.notifyDataSetChanged()
        emptyText.visibility = if (printerEntries.isEmpty()) View.VISIBLE else View.GONE
    }

    @SuppressLint("MissingPermission")
    private fun bondedDevicesCompat(): List<Pair<String, String>> {
        val bm = getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
        val ad: BluetoothAdapter? = bm?.adapter
        if (ad == null) return emptyList()
        if (!hasBluetoothConnectPermission()) return emptyList()
        val bonded = ad.bondedDevices ?: return emptyList()
        return bonded.map { d ->
            val name = try { d.name } catch (_: SecurityException) { null } ?: "Unknown"
            name to d.address
        }.sortedBy { it.first.lowercase() }
    }

    private fun hasBluetoothConnectPermission(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
        return ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) ==
            PackageManager.PERMISSION_GRANTED
    }
}
