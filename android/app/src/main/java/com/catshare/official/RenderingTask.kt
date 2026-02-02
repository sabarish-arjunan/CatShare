package com.catshare.official

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.util.Base64
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream

class RenderingTask(
    private val context: Context,
    private val renderData: String,
    private val totalItems: Int,
    private val callback: RenderingCallback
) : Runnable {
    
    companion object {
        private const val TAG = "RenderingTask"
    }
    
    interface RenderingCallback {
        fun onProgress(current: Int, total: Int, currentItem: String)
        fun onComplete()
        fun onError(error: String)
    }
    
    @Volatile
    private var cancelled = false
    
    override fun run() {
        try {
            Log.d(TAG, "Starting rendering task")
            
            // Parse the render data JSON
            val data = JSONObject(renderData)
            val items = data.getJSONArray("items")
            val outputFormat = data.optString("format", "png")
            val outputWidth = data.optInt("width", 1080)
            val outputHeight = data.optInt("height", 1080)
            
            val renderItems = mutableListOf<RenderItem>()
            for (i in 0 until items.length()) {
                val item = items.getJSONObject(i)
                renderItems.add(
                    RenderItem(
                        id = item.getString("id"),
                        name = item.getString("name"),
                        imagePath = item.optString("imagePath", ""),
                        renderConfig = item.optJSONObject("renderConfig")
                    )
                )
            }
            
            // Process each item
            for ((index, item) in renderItems.withIndex()) {
                if (cancelled) break
                
                // Update progress
                callback.onProgress(index + 1, renderItems.size, item.name)
                
                // Render the item
                renderItem(item, outputFormat, outputWidth, outputHeight)
                
                // Small delay to prevent overwhelming the system
                Thread.sleep(100)
            }
            
            if (!cancelled) {
                callback.onComplete()
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Rendering error", e)
            callback.onError(e.message ?: "Unknown error")
        }
    }
    
    private fun renderItem(
        item: RenderItem,
        format: String,
        width: Int,
        height: Int
    ) {
        // Get the output directory
        val outputDir = File(context.filesDir, "rendered")
        if (!outputDir.exists()) {
            outputDir.mkdirs()
        }
        
        // Create output file
        val outputFile = File(outputDir, "${item.id}.$format")
        
        // Load source image if exists
        var sourceBitmap: Bitmap? = null
        if (item.imagePath.isNotEmpty()) {
            val sourceFile = File(item.imagePath)
            if (sourceFile.exists()) {
                sourceBitmap = BitmapFactory.decodeFile(sourceFile.absolutePath)
            }
        }
        
        // Create output bitmap
        val outputBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(outputBitmap)
        
        // Apply rendering
        renderToCanvas(canvas, sourceBitmap, item, width, height)
        
        // Save to file
        FileOutputStream(outputFile).use { out ->
            when (format.lowercase()) {
                "png" -> outputBitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
                "jpg", "jpeg" -> outputBitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
                else -> outputBitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
            }
            out.flush()
        }
        
        // Clean up
        sourceBitmap?.recycle()
        outputBitmap.recycle()
        
        Log.d(TAG, "Rendered: ${outputFile.absolutePath}")
    }
    
    private fun renderToCanvas(
        canvas: Canvas,
        sourceBitmap: Bitmap?,
        item: RenderItem,
        width: Int,
        height: Int
    ) {
        // Fill background
        val bgPaint = Paint().apply {
            color = 0xFFFFFFFF.toInt() // White background
        }
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), bgPaint)
        
        // Draw source image if available
        sourceBitmap?.let { bitmap ->
            // Calculate scaling to fit
            val scale = minOf(
                width.toFloat() / bitmap.width,
                height.toFloat() / bitmap.height
            )
            
            val scaledWidth = (bitmap.width * scale).toInt()
            val scaledHeight = (bitmap.height * scale).toInt()
            
            val left = (width - scaledWidth) / 2
            val top = (height - scaledHeight) / 2
            
            val destRect = Rect(left, top, left + scaledWidth, top + scaledHeight)
            canvas.drawBitmap(bitmap, null, destRect, null)
        }
        
        // Add text overlay (product name)
        val textPaint = Paint().apply {
            color = 0xFF000000.toInt()
            textSize = 48f
            isAntiAlias = true
        }
        
        val textX = 20f
        val textY = height - 30f
        canvas.drawText(item.name, textX, textY, textPaint)
        
        // You can add more rendering logic here based on item.renderConfig
        // Examples:
        // - Watermarks: renderWatermark(canvas, width, height)
        // - Borders: renderBorder(canvas, width, height)
        // - Custom overlays: renderOverlay(canvas, item.renderConfig)
        // - Price tags: renderPriceTag(canvas, item)
    }
    
    // Optional: Add custom rendering methods
    private fun renderWatermark(canvas: Canvas, width: Int, height: Int) {
        val watermarkPaint = Paint().apply {
            color = 0x33000000 // Semi-transparent
            textSize = 36f
            isAntiAlias = true
        }
        canvas.drawText(
            "CatShare",
            width - 200f,
            height - 50f,
            watermarkPaint
        )
    }
    
    private fun renderBorder(canvas: Canvas, width: Int, height: Int) {
        val borderPaint = Paint().apply {
            color = 0xFF000000.toInt()
            style = Paint.Style.STROKE
            strokeWidth = 4f
        }
        canvas.drawRect(
            2f,
            2f,
            width - 2f,
            height - 2f,
            borderPaint
        )
    }
    
    fun cancel() {
        cancelled = true
    }
    
    data class RenderItem(
        val id: String,
        val name: String,
        val imagePath: String,
        val renderConfig: JSONObject?
    )
}
