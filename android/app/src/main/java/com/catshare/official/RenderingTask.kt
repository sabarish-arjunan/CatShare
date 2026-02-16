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

            val data = JSONObject(renderData)
            val items = data.getJSONArray("items")
            val outputFormat = data.optString("format", "png")
            val outputWidth = data.optInt("width", 1080)
            val outputHeight = data.optInt("height", 1080)
            val watermarkConfig = data.optJSONObject("watermark")

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

            for ((index, item) in renderItems.withIndex()) {
                if (cancelled) break

                callback.onProgress(index + 1, renderItems.size, item.name)
                renderItem(item, outputFormat, outputWidth, outputHeight, watermarkConfig)
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
        height: Int,
        watermarkConfig: JSONObject?
    ) {
        val outputDir = File(context.filesDir, "rendered")
        if (!outputDir.exists()) {
            outputDir.mkdirs()
        }

        val outputFile = File(outputDir, "${item.id}.$format")

        var sourceBitmap: Bitmap? = null
        if (item.imagePath.isNotEmpty()) {
            sourceBitmap = if (item.imagePath.startsWith("data:image") || !item.imagePath.startsWith("/")) {
                try {
                    val base64String = if (item.imagePath.startsWith("data:image")) {
                        item.imagePath.substringAfter(",")
                    } else {
                        item.imagePath
                    }
                    val decodedBytes = Base64.decode(base64String, Base64.DEFAULT)
                    val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
                    Log.d(TAG, "Successfully decoded base64 image for: ${item.name}")
                    bitmap
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to decode base64 image for ${item.name}: ${e.message}")
                    null
                }
            } else {
                val sourceFile = File(item.imagePath)
                if (sourceFile.exists()) {
                    val bitmap = BitmapFactory.decodeFile(sourceFile.absolutePath)
                    Log.d(TAG, "Successfully loaded image from file: ${item.imagePath}")
                    bitmap
                } else {
                    Log.w(TAG, "Image file not found: ${item.imagePath}")
                    null
                }
            }
        }

        val outputBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(outputBitmap)

        renderToCanvas(canvas, sourceBitmap, item, width, height, watermarkConfig)

        FileOutputStream(outputFile).use { out ->
            when (format.lowercase()) {
                "png" -> outputBitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
                "jpg", "jpeg" -> outputBitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
                else -> outputBitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
            }
            out.flush()
        }

        sourceBitmap?.recycle()
        outputBitmap.recycle()

        Log.d(TAG, "Rendered: ${outputFile.absolutePath}")
    }

    private fun renderToCanvas(
        canvas: Canvas,
        sourceBitmap: Bitmap?,
        item: RenderItem,
        width: Int,
        height: Int,
        watermarkConfig: JSONObject?
    ) {
        val bgPaint = Paint().apply {
            color = 0xFFFFFFFF.toInt()
        }
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), bgPaint)

        sourceBitmap?.let { bitmap ->
            val padding = 40
            val availableWidth = width - (padding * 2)
            val availableHeight = (height * 0.65).toInt() - padding

            val scale = minOf(
                availableWidth.toFloat() / bitmap.width,
                availableHeight.toFloat() / bitmap.height
            )

            val scaledWidth = (bitmap.width * scale).toInt()
            val scaledHeight = (bitmap.height * scale).toInt()

            val left = (width - scaledWidth) / 2
            val top = padding + (availableHeight - scaledHeight) / 2

            val destRect = Rect(left, top, left + scaledWidth, top + scaledHeight)
            canvas.drawBitmap(bitmap, null, destRect, null)
            Log.d(TAG, "Rendered image for: ${item.name} at rect: $destRect")
        }

        val namePaint = Paint().apply {
            color = 0xFF000000.toInt()
            textSize = 80f
            isAntiAlias = true
            isFakeBoldText = true
            textAlign = Paint.Align.CENTER
        }

        val nameY = (height * 0.70).toFloat()
        val words = item.name.split(" ")
        val lines = mutableListOf<String>()
        var currentLine = ""

        for (word in words) {
            val testLine = if (currentLine.isEmpty()) word else "$currentLine $word"
            val textWidth = namePaint.measureText(testLine)

            if (textWidth > (width * 0.9f)) {
                if (currentLine.isNotEmpty()) lines.add(currentLine)
                currentLine = word
            } else {
                currentLine = testLine
            }
        }
        if (currentLine.isNotEmpty()) lines.add(currentLine)

        var y = nameY
        for (line in lines) {
            canvas.drawText(line, width / 2f, y, namePaint)
            y += 90f
        }

        item.renderConfig?.let { config ->
            try {
                val catalogues = config.getJSONArray("catalogues")
                if (catalogues.length() > 0) {
                    val catalogue = catalogues.getJSONObject(0)
                    val label = catalogue.optString("label", "")

                    if (label.isNotEmpty()) {
                        val labelPaint = Paint().apply {
                            color = 0xFF666666.toInt()
                            textSize = 48f
                            isAntiAlias = true
                            textAlign = Paint.Align.CENTER
                        }

                        canvas.drawText(
                            label.uppercase(),
                            width / 2f,
                            (height * 0.92).toFloat(),
                            labelPaint
                        )
                    }
                }

                Unit
            } catch (e: Exception) {
                Log.w(TAG, "Could not render config info: ${e.message}")
            }
        }

        renderWatermark(canvas, width, height, watermarkConfig)
    }

    private fun renderWatermark(canvas: Canvas, width: Int, height: Int, config: JSONObject?) {
        try {
            if (config == null || !config.optBoolean("enabled", false)) return

            val watermarkText = config.optString("text", "CatShare")
            val position = config.optString("position", "bottom-left")

            val watermarkPaint = Paint().apply {
                color = 0x44000000
                textSize = 42f
                isAntiAlias = true
                style = Paint.Style.FILL
            }

            val padding = 40f
            var x = width / 2f
            var y = height - padding

            // Normalize and handle position logic
            val normalizedPosition = position.lowercase().replace("_", "-")

            when (normalizedPosition) {
                "top-left" -> {
                    watermarkPaint.textAlign = Paint.Align.LEFT
                    x = padding
                    y = padding + watermarkPaint.textSize
                }
                "top-center" -> {
                    watermarkPaint.textAlign = Paint.Align.CENTER
                    x = width / 2f
                    y = padding + watermarkPaint.textSize
                }
                "top-right" -> {
                    watermarkPaint.textAlign = Paint.Align.RIGHT
                    x = width - padding
                    y = padding + watermarkPaint.textSize
                }
                "middle-left" -> {
                    watermarkPaint.textAlign = Paint.Align.LEFT
                    x = padding
                    y = height / 2f
                }
                "middle-center" -> {
                    watermarkPaint.textAlign = Paint.Align.CENTER
                    x = width / 2f
                    y = height / 2f
                }
                "middle-right" -> {
                    watermarkPaint.textAlign = Paint.Align.RIGHT
                    x = width - padding
                    y = height / 2f
                }
                "bottom-left" -> {
                    watermarkPaint.textAlign = Paint.Align.LEFT
                    x = padding
                    y = height - padding
                }
                "bottom-right" -> {
                    watermarkPaint.textAlign = Paint.Align.RIGHT
                    x = width - padding
                    y = height - padding
                }
                "bottom-center" -> {
                    watermarkPaint.textAlign = Paint.Align.CENTER
                    x = width / 2f
                    y = height - padding
                }
                else -> {
                    watermarkPaint.textAlign = Paint.Align.CENTER
                    x = width / 2f
                    y = height - padding
                }
            }

            canvas.drawText(watermarkText, x, y, watermarkPaint)
        } catch (e: Exception) {
            Log.w(TAG, "Could not render watermark: ${e.message}")
        }
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
