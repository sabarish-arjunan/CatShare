package com.catshare.official.render

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import androidx.work.WorkManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Service that handles background rendering even when the app is closed.
 * Uses WorkManager to manage rendering tasks.
 */
class BackgroundRenderingService : Service() {

    private val tag = "BackgroundRenderingService"
    private val scope = CoroutineScope(Dispatchers.Default)

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(tag, "BackgroundRenderingService started")

        scope.launch {
            try {
                // Check for pending rendering tasks from localStorage
                val pendingJobs = getPendingRenderJobs()
                
                if (pendingJobs.isNotEmpty()) {
                    Log.d(tag, "Found ${pendingJobs.size} pending render jobs")
                    
                    // Enqueue jobs with WorkManager
                    RenderManager.enqueueBatch(this@BackgroundRenderingService, pendingJobs)
                    
                    // Clear the pending jobs list after enqueueing
                    clearPendingRenderJobs()
                    
                    Log.d(tag, "Enqueued ${pendingJobs.size} jobs for background rendering")
                } else {
                    Log.d(tag, "No pending render jobs found")
                    stopSelf()
                }
            } catch (e: Exception) {
                Log.e(tag, "Error processing background rendering", e)
                stopSelf()
            }
        }

        return START_STICKY
    }

    /**
     * Retrieve pending render jobs from shared preferences
     * (This would be set by the React app before closing)
     */
    private fun getPendingRenderJobs(): List<RenderJob> {
        return try {
            val sharedPref = getSharedPreferences("catshare_render", MODE_PRIVATE)
            val jobsJson = sharedPref.getString("pending_jobs", "") ?: ""
            
            if (jobsJson.isEmpty()) {
                emptyList()
            } else {
                // Parse JSON array of render jobs
                parseRenderJobs(jobsJson)
            }
        } catch (e: Exception) {
            Log.e(tag, "Error reading pending jobs", e)
            emptyList()
        }
    }

    /**
     * Clear pending render jobs from shared preferences
     */
    private fun clearPendingRenderJobs() {
        try {
            val sharedPref = getSharedPreferences("catshare_render", MODE_PRIVATE)
            sharedPref.edit().apply {
                remove("pending_jobs")
                apply()
            }
        } catch (e: Exception) {
            Log.e(tag, "Error clearing pending jobs", e)
        }
    }

    /**
     * Parse render jobs from JSON string
     */
    private fun parseRenderJobs(jsonString: String): List<RenderJob> {
        return try {
            val jobs = mutableListOf<RenderJob>()
            val jsonArray = org.json.JSONArray(jsonString)
            
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                val job = RenderJob(
                    html = obj.optString("html", ""),
                    fileName = obj.optString("fileName", "")
                )
                if (job.html.isNotEmpty() && job.fileName.isNotEmpty()) {
                    jobs.add(job)
                }
            }
            
            jobs
        } catch (e: Exception) {
            Log.e(tag, "Error parsing render jobs JSON", e)
            emptyList()
        }
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(tag, "BackgroundRenderingService destroyed")
    }
}
