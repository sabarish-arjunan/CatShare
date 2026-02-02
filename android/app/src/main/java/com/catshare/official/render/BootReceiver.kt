package com.catshare.official.render

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Broadcast receiver that triggers background rendering when device boots
 * Useful for continuing rendering tasks after device restarts
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d("BootReceiver", "Device boot completed, checking for pending render jobs")
            
            try {
                // Start the background rendering service
                val renderIntent = Intent(context, BackgroundRenderingService::class.java)
                context.startService(renderIntent)
                Log.d("BootReceiver", "Started BackgroundRenderingService")
            } catch (e: Exception) {
                Log.e("BootReceiver", "Error starting background rendering service", e)
            }
        }
    }
}
