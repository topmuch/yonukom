package com.yonukom.printbridge

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import fi.iki.elonen.NanoHTTPD

/**
 * Foreground service that hosts the [HttpServer] and the [BluetoothPrinterManager].
 *
 * While running, it exposes a singleton [instance] so the UI (and any future caller)
 * can reach the shared [btManager] — this guarantees that a connect issued from
 * MainActivity is seen by the HttpServer's /print handler (same BluetoothPrinterManager
 * → same cached BluetoothSocket).
 */
class PrintService : Service() {

    companion object {
        private const val TAG = "PrintService"
        private const val CHANNEL_ID = "yonukom_print"
        private const val NOTIF_ID = 0xC0DE

        /** Singleton accessor — null while the service is stopped. */
        @Volatile
        var instance: PrintService? = null
            private set
    }

    @Volatile
    private var server: HttpServer? = null

    @Volatile
    private var btMgr: BluetoothPrinterManager? = null

    /** Shared manager — callers from MainActivity go through this. */
    val btManager: BluetoothPrinterManager?
        get() = btMgr

    /** True once the HTTP server has been successfully started. */
    val isRunning: Boolean
        get() = server != null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // 1. Start as foreground first — required for FGS while connected to a BT device.
        startForegroundCompat()

        // 2. Lazily create the Bluetooth manager (shared singleton via [btManager]).
        if (btMgr == null) {
            btMgr = BluetoothPrinterManager(applicationContext)
        }

        // 3. Start the HTTP server (idempotent — restart if already running).
        if (server == null) {
            try {
                val s = HttpServer(btMgr!!, port = 47822)
                s.start(NanoHTTPD.SOCKET_READ_TIMEOUT, false) // NanoHTTPD: 5s default read timeout
                server = s
                Log.i(TAG, "HTTP server listening on http://localhost:47822")
            } catch (e: IOException) {
                Log.e(TAG, "Failed to start HTTP server", e)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start HTTP server", e)
            }
        }

        // 4. Publish singleton so MainActivity can reach the same manager.
        instance = this

        refreshNotification()
        return START_STICKY
    }

    override fun onDestroy() {
        instance = null
        try {
            server?.stop()
        } catch (e: Exception) {
            Log.w(TAG, "Error stopping HTTP server", e)
        }
        server = null
        btMgr?.shutdown()
        btMgr = null
        super.onDestroy()
    }

    // ---------------- foreground notification ----------------

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (nm.getNotificationChannel(CHANNEL_ID) == null) {
                val ch = NotificationChannel(
                    CHANNEL_ID,
                    "Pont d'impression YonuKom",
                    NotificationManager.IMPORTANCE_LOW,
                ).apply {
                    description = "Maintient le serveur HTTP local et la liaison Bluetooth."
                    setShowBadge(false)
                }
                nm.createNotificationChannel(ch)
            }
        }
    }

    /** Re-publish the foreground notification with the current printer status. */
    fun refreshNotification() {
        val mgr = btMgr
        val info = mgr?.connectedPrinterInfo()
        val text = if (info != null) {
            "Pont actif — ${info.first}"
        } else {
            "Pont actif — port 47822"
        }
        startForegroundWithNotification(buildNotification(text))
    }

    private fun buildNotification(text: String): Notification {
        val pi = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("YonuKom Print Bridge")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
            .setOngoing(true)
            .setContentIntent(pi)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun startForegroundCompat() {
        // Initial placeholder notification — required before any FGS work.
        startForegroundWithNotification(buildNotification("Pont actif — port 47822"))
    }

    private fun startForegroundWithNotification(notification: Notification) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            // API 34+: must declare the foreground service type at startForeground time.
            startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE)
        } else {
            startForeground(NOTIF_ID, notification)
        }
    }
}
