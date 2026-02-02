package com.catshare.official

import android.content.Intent
import android.os.Build
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONObject

@CapacitorPlugin(name = "BackgroundRenderer")
class BackgroundRendererPlugin : Plugin() {

    @PluginMethod
    fun startRendering(call: PluginCall) {
        val renderData = call.getObject("renderData")

        if (renderData == null) {
            call.reject("Render data is required")
            return
        }

        try {
            // Convert JSObject to JSON string for proper serialization
            val renderDataJson = renderData.toString()
            val jsonData = JSONObject(renderDataJson)
            val totalItems = jsonData.getJSONArray("items").length()

            Log.d("BackgroundRendererPlugin", "Starting background rendering with $totalItems items")
            Log.d("BackgroundRendererPlugin", "Render data: ${renderDataJson.take(500)}...")

            // Create intent for the service with render data
            val serviceIntent = Intent(context, RenderingService::class.java).apply {
                putExtra("renderData", renderDataJson)
                putExtra("totalItems", totalItems)
            }

            // Start the foreground service
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }

            val result = JSObject().apply {
                put("success", true)
                put("message", "Background rendering started with $totalItems items")
            }
            call.resolve(result)

        } catch (e: Exception) {
            Log.e("BackgroundRendererPlugin", "Failed to start rendering: ${e.message}", e)
            call.reject("Failed to start rendering service: ${e.message}")
        }
    }
    
    @PluginMethod
    fun stopRendering(call: PluginCall) {
        try {
            val serviceIntent = Intent(context, RenderingService::class.java)
            context.stopService(serviceIntent)
            
            val result = JSObject().apply {
                put("success", true)
                put("message", "Background rendering stopped")
            }
            call.resolve(result)
            
        } catch (e: Exception) {
            call.reject("Failed to stop rendering service: ${e.message}")
        }
    }
    
    @PluginMethod
    fun getStatus(call: PluginCall) {
        // You can implement status checking logic here
        // For example, check if service is running using ActivityManager
        val result = JSObject().apply {
            put("isRunning", isServiceRunning())
        }
        call.resolve(result)
    }
    
    private fun isServiceRunning(): Boolean {
        // You can implement actual service status check here
        // For now, returning false as placeholder
        return false
    }
}
