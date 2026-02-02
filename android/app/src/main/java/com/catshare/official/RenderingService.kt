package com.catshare.official

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat

class RenderingService : Service() {

    companion object {
        private const val TAG = "RenderingService"
        private const val CHANNEL_ID = "RenderingServiceChannel"
        private const val NOTIFICATION_ID = 1
    }

    private lateinit var notificationManager: NotificationManager
    private val handler = Handler(Looper.getMainLooper())
    private var renderingTask: RenderingTask? = null
    private var wakeLock: PowerManager.WakeLock? = null
    
    override fun onCreate() {
        super.onCreate()
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createNotificationChannel()
        Log.d(TAG, "RenderingService created")
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "RenderingService started")

        // Get rendering parameters from intent
        val renderData = intent?.getStringExtra("renderData") ?: ""
        val totalItems = intent?.getIntExtra("totalItems", 0) ?: 0

        if (renderData.isEmpty() || totalItems == 0) {
            Log.w(TAG, "No render data provided, stopping service")
            stopSelf()
            return START_NOT_STICKY
        }

        // Start foreground service with notification
        val notification = createNotification(
            "Rendering in progress",
            "Processing $totalItems items...",
            0,
            totalItems
        )
        startForeground(NOTIFICATION_ID, notification)

        Log.d(TAG, "Foreground service started, beginning render task with $totalItems items")

        // Start rendering task
        startRendering(renderData, totalItems)

        // Return START_STICKY so service restarts if killed
        return START_STICKY
    }
    
    private fun startRendering(renderData: String, totalItems: Int) {
        renderingTask = RenderingTask(
            context = this,
            renderData = renderData,
            totalItems = totalItems,
            callback = object : RenderingTask.RenderingCallback {
                override fun onProgress(current: Int, total: Int, currentItem: String) {
                    updateNotification(
                        "Rendering in progress",
                        "Processing item $current of $total",
                        current,
                        total
                    )
                }
                
                override fun onComplete() {
                    updateNotification(
                        "Rendering complete",
                        "All items processed successfully",
                        100,
                        100
                    )
                    
                    // Stop service after a delay
                    handler.postDelayed({
                        stopForeground(true)
                        stopSelf()
                    }, 3000)
                }
                
                override fun onError(error: String) {
                    updateNotification(
                        "Rendering failed",
                        error,
                        0,
                        100
                    )
                    
                    handler.postDelayed({
                        stopForeground(true)
                        stopSelf()
                    }, 5000)
                }
            }
        )
        
        // Execute rendering on background thread
        Thread(renderingTask).start()
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Rendering Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Background rendering progress"
            }
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(
        title: String,
        content: String,
        progress: Int,
        max: Int
    ): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE
        )
        
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(android.R.drawable.ic_menu_upload)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
        
        if (max > 0) {
            builder.setProgress(max, progress, false)
        }
        
        return builder.build()
    }
    
    private fun updateNotification(title: String, content: String, progress: Int, max: Int) {
        val notification = createNotification(title, content, progress, max)
        notificationManager.notify(NOTIFICATION_ID, notification)
    }
    
    override fun onDestroy() {
        super.onDestroy()
        renderingTask?.cancel()
        Log.d(TAG, "RenderingService destroyed")
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
}
