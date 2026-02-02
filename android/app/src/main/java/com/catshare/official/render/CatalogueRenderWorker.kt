package com.catshare.official.render

import android.content.Context
import android.graphics.Bitmap
import android.os.Handler
import android.os.Looper
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.delay
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.CountDownLatch

class CatalogueRenderWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            val html = inputData.getString("html") ?: return Result.failure()
            val fileName = inputData.getString("fileName") ?: return Result.failure()
            val folderName = inputData.getString("folderName") ?: "renders"

            render(html, fileName, folderName)
            Result.success()
        } catch (e: Exception) {
            android.util.Log.e("CatalogueRenderWorker", "Rendering failed", e)
            Result.retry()
        }
    }

    private suspend fun render(html: String, fileName: String, folderName: String) {
        val appContext = applicationContext
        val latch = CountDownLatch(1)

        Handler(Looper.getMainLooper()).post {
            val webView = WebView(appContext)
            webView.settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                mixedContentMode = WebView.MIXED_CONTENT_ALWAYS_ALLOW
            }
            webView.setLayerType(WebView.LAYER_TYPE_SOFTWARE, null)

            webView.webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)

                    view?.postDelayed({
                        try {
                            renderAndSave(view, fileName, folderName)
                        } finally {
                            latch.countDown()
                        }
                    }, 500)
                }
            }

            webView.loadDataWithBaseURL(null, html, "text/html; charset=utf-8", "UTF-8", null)
        }

        // Wait for rendering to complete (max 10 seconds)
        val completed = latch.await(10, java.util.concurrent.TimeUnit.SECONDS)
        if (!completed) {
            android.util.Log.w("CatalogueRenderWorker", "Rendering timeout for $fileName")
        }
    }

    private fun renderAndSave(view: WebView, fileName: String, folderName: String) {
        try {
            val width = 1080
            val height = view.contentHeight.coerceAtLeast(600)

            // Measure and layout the WebView
            view.measure(
                android.view.View.MeasureSpec.makeMeasureSpec(width, android.view.View.MeasureSpec.EXACTLY),
                android.view.View.MeasureSpec.makeMeasureSpec(height, android.view.View.MeasureSpec.EXACTLY)
            )
            view.layout(0, 0, width, height)

            // Create bitmap from WebView
            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val canvas = android.graphics.Canvas(bitmap)
            canvas.drawColor(android.graphics.Color.WHITE)
            view.draw(canvas)

            // Save to external storage (Directory.External equivalent)
            saveBitmapToExternalStorage(bitmap, fileName, folderName)

            android.util.Log.d("CatalogueRenderWorker", "Successfully rendered: $folderName/$fileName")
        } catch (e: Exception) {
            android.util.Log.e("CatalogueRenderWorker", "Error rendering/saving image", e)
        }
    }

    private fun saveBitmapToExternalStorage(bitmap: Bitmap, fileName: String, folderName: String) {
        // Get app-specific external files directory (/storage/emulated/0/Android/data/com.catshare.official/files/)
        val appExternalFilesDir = applicationContext.getExternalFilesDir(null)

        if (appExternalFilesDir == null) {
            android.util.Log.e("CatalogueRenderWorker", "External files directory not available")
            return
        }

        val folder = File(appExternalFilesDir, folderName)
        if (!folder.exists()) {
            folder.mkdirs()
        }

        val file = File(folder, fileName)

        try {
            FileOutputStream(file).use { fos ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, fos)
                fos.flush()
            }
            android.util.Log.d("CatalogueRenderWorker", "Bitmap saved to: ${file.absolutePath}")
        } catch (e: Exception) {
            android.util.Log.e("CatalogueRenderWorker", "Failed to save bitmap", e)
            throw e
        }
    }
}
