package com.yonukom.printbridge

import fi.iki.elonen.NanoHTTPD
import kotlinx.coroutines.runBlocking
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException

/**
 * Tiny localhost HTTP server that fronts the BluetoothPrinterManager.
 *
 * Listens on 127.0.0.1:47822 and exposes 4 endpoints matching the YonuKom web app protocol:
 *   GET  /health   → {ok, version, printer:{name,address,connected}}
 *   GET  /printers → {printers:[{address,name},...]}
 *   POST /connect  body {"address":"<mac>"} → {ok} | {ok:false,error}
 *   POST /print    body = raw ESC/POS bytes (application/octet-stream) → {ok} | {ok:false,error}
 *
 * CORS is enabled on every response so the HTTPS web app can fetch cross-origin from Chrome
 * on Android. OPTIONS preflight returns 204 with CORS headers and no body.
 *
 * Bluetooth connect/send is dispatched off the NanoHTTPD serving thread via the
 * BluetoothPrinterManager's IO executor (see [BluetoothPrinterManager.connectAsync]/[sendAsync]).
 */
class HttpServer(
    private val btManager: BluetoothPrinterManager,
    port: Int = 47822,
) : NanoHTTPD(port) {

    companion object {
        private const val VERSION = "1.0.0"

        private const val CORS_ORIGIN = "*"
        private const val CORS_METHODS = "GET, POST, OPTIONS"
        private const val CORS_HEADERS = "Content-Type, Content-Length"

        private const val ERR_NOT_CONNECTED = "Aucune imprimante connectée"
    }

    /**
     * Main dispatch — called by NanoHTTPD on its worker threads. We handle CORS uniformly
     * here so every response (including errors and preflight) carries the right headers.
     */
    override fun serve(session: IHTTPSession): Response {
        val method: Method = try {
            session.method
        } catch (e: Exception) {
            return cors(jsonErr(Status.BAD_REQUEST, "Méthode invalide"))
        }

        // CORS preflight — must come back fast and headered.
        if (method == Method.OPTIONS) {
            val r = newFixedLengthResponse(Status.NO_CONTENT, MIME_PLAINTEXT, "")
            return cors(r)
        }

        val uri = session.uri.trimEnd('/').ifEmpty { "/" }
        val resp: Response = try {
            when {
                method == Method.GET && uri == "/health" -> handleHealth()
                method == Method.GET && uri == "/printers" -> handlePrinters()
                method == Method.POST && uri == "/connect" -> handleConnect(session)
                method == Method.POST && uri == "/print" -> handlePrint(session)
                else -> jsonErr(Status.NOT_FOUND, "Endpoint introuvable: ${method.name} $uri")
            }
        } catch (e: Throwable) {
            jsonErr(Status.INTERNAL_ERROR, "Erreur serveur: ${e.message ?: e.javaClass.simpleName}")
        }
        return cors(resp)
    }

    // ---------------- endpoints ----------------

    private fun handleHealth(): Response {
        val info = btManager.connectedPrinterInfo()
        val printer = JSONObject()
        if (info != null) {
            printer.put("name", info.first)
            printer.put("address", info.second)
            printer.put("connected", true)
        } else {
            printer.put("name", JSONObject.NULL)
            printer.put("address", JSONObject.NULL)
            printer.put("connected", false)
        }
        val body = JSONObject()
            .put("ok", true)
            .put("version", VERSION)
            .put("printer", printer)
            .toString()
        return jsonOk(body)
    }

    private fun handlePrinters(): Response {
        val arr = JSONArray()
        btManager.listPairedPrinters().forEach { (name, address) ->
            arr.put(JSONObject().put("address", address).put("name", name))
        }
        val body = JSONObject().put("printers", arr).toString()
        return jsonOk(body)
    }

    private fun handleConnect(session: IHTTPSession): Response {
        val bodyStr = readBodyString(session)
        val address = try {
            JSONObject(bodyStr).optString("address", "")
        } catch (e: org.json.JSONException) {
            return jsonErr(Status.BAD_REQUEST, "Corps JSON invalide")
        }
        if (address.isBlank()) {
            return jsonErr(Status.BAD_REQUEST, "Champ \"address\" manquant")
        }
        val err = runBlocking { btManager.connectAsync(address) }
        return if (err == null) {
            jsonOk(JSONObject().put("ok", true).toString())
        } else {
            jsonErr(Status.OK, err)
        }
    }

    private fun handlePrint(session: IHTTPSession): Response {
        // Per protocol: if not connected, return the exact French error.
        if (!btManager.isConnected()) {
            return jsonErr(Status.OK, ERR_NOT_CONNECTED)
        }
        val bytes = readBodyBytes(session)
        val err = runBlocking { btManager.sendAsync(bytes) }
        return if (err == null) {
            jsonOk(JSONObject().put("ok", true).toString())
        } else {
            jsonErr(Status.OK, err)
        }
    }

    // ---------------- body readers ----------------

    /** Read the raw request body as bytes using the Content-Length header. */
    private fun readBodyBytes(session: IHTTPSession): ByteArray {
        val len = session.headers?.get("content-length")?.toLongOrNull() ?: 0L
        if (len <= 0L) return ByteArray(0)
        val n = len.toInt()
        if (n < 0) return ByteArray(0) // overflow guard
        val buf = ByteArray(n)
        var total = 0
        try {
            val input = session.inputStream
            while (total < n) {
                val r = input.read(buf, total, n - total)
                if (r < 0) break
                total += r
            }
        } catch (e: IOException) {
            // best-effort — return whatever we got
        }
        return if (total == n) buf else buf.copyOf(total)
    }

    /** Read the request body as a UTF-8 string (used for JSON bodies). */
    private fun readBodyString(session: IHTTPSession): String {
        val bytes = readBodyBytes(session)
        return if (bytes.isEmpty()) "" else String(bytes, Charsets.UTF_8)
    }

    // ---------------- response helpers ----------------

    private fun jsonOk(body: String): Response =
        newFixedLengthResponse(Status.OK, "application/json", body)

    private fun jsonErr(status: Response.IStatus, message: String): Response {
        val body = JSONObject().put("ok", false).put("error", message).toString()
        return newFixedLengthResponse(status, "application/json", body)
    }

    /** Attach the CORS headers required by the YonuKom web app protocol. */
    private fun cors(response: Response): Response {
        response.addHeader("Access-Control-Allow-Origin", CORS_ORIGIN)
        response.addHeader("Access-Control-Allow-Methods", CORS_METHODS)
        response.addHeader("Access-Control-Allow-Headers", CORS_HEADERS)
        return response
    }
}
