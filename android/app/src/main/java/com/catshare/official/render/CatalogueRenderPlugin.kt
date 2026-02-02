package com.catshare.official.render

import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import org.json.JSONArray

class CatalogueRenderPlugin : Plugin() {

    /**
     * Render a single product image
     * @param call PluginCall with html, fileName, and optional folderName
     */
    @PluginMethod
    fun render(call: PluginCall) {
        val html = call.getString("html")
        val fileName = call.getString("fileName")
        val folderName = call.getString("folderName") ?: "renders"

        if (html == null || fileName == null) {
            call.reject("html or fileName missing")
            return
        }

        try {
            RenderManager.enqueue(context, html, fileName, folderName)
            call.resolve()
        } catch (e: Exception) {
            android.util.Log.e("CatalogueRenderPlugin", "Error enqueueing render job", e)
            call.reject("Failed to enqueue render job: ${e.message}")
        }
    }

    /**
     * Render multiple products in batch (for background rendering)
     * @param call PluginCall with renderJobs array and optional folderName
     */
    @PluginMethod
    fun renderBatch(call: PluginCall) {
        val jobsArray = call.getArray("renderJobs")
        val folderName = call.getString("folderName") ?: "renders"

        if (jobsArray == null || jobsArray.length() == 0) {
            call.reject("renderJobs array is empty or missing")
            return
        }

        try {
            val renderJobs = mutableListOf<RenderJob>()

            for (i in 0 until jobsArray.length()) {
                val jobObj = jobsArray.getJSONObject(i)
                val html = jobObj.optString("html", "")
                val fileName = jobObj.optString("fileName", "")

                if (html.isNotEmpty() && fileName.isNotEmpty()) {
                    renderJobs.add(RenderJob(html, fileName))
                }
            }

            if (renderJobs.isEmpty()) {
                call.reject("No valid render jobs found")
                return
            }

            RenderManager.enqueueBatch(context, renderJobs, folderName)

            val result = com.getcapacitor.JSObject()
            result.put("jobCount", renderJobs.size)
            result.put("message", "Batch render enqueued with ${renderJobs.size} jobs")
            call.resolve(result)
        } catch (e: Exception) {
            android.util.Log.e("CatalogueRenderPlugin", "Error enqueueing batch render", e)
            call.reject("Failed to enqueue batch render: ${e.message}")
        }
    }

    /**
     * Start background rendering service (when app is closed)
     */
    @PluginMethod
    fun startBackgroundRendering(call: PluginCall) {
        try {
            RenderManager.startBackgroundRendering(context)
            call.resolve()
        } catch (e: Exception) {
            android.util.Log.e("CatalogueRenderPlugin", "Error starting background rendering", e)
            call.reject("Failed to start background rendering: ${e.message}")
        }
    }

    /**
     * Cancel all pending render jobs
     */
    @PluginMethod
    fun cancelRenders(call: PluginCall) {
        try {
            RenderManager.cancelAll(context)
            call.resolve()
        } catch (e: Exception) {
            android.util.Log.e("CatalogueRenderPlugin", "Error cancelling renders", e)
            call.reject("Failed to cancel renders: ${e.message}")
        }
    }
}
