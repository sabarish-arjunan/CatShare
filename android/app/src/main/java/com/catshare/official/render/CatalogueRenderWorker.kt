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

class CatalogueRenderWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val html = inputData.getString("html") ?: return Result.failure()
        val fileName = inputData.getString("fileName") ?: return Result.failure()

        render(html, fileName)
        return Result.success()
    }

    private suspend fun render(html: String, fileName: String) {
        val appContext = applicationContext

        Handler(Looper.getMainLooper()).post {
            val webView = WebView(appContext)
            webView.settings.javaScriptEnabled = true
            webView.settings.domStorageEnabled = true
            webView.setLayerType(WebView.LAYER_TYPE_SOFTWARE, null)

            webView.webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    view?.postDelayed({
                        val width = 1080
                        val height = view.contentHeight.coerceAtLeast(1)

                        view.measure(
                            android.view.View.MeasureSpec.makeMeasureSpec(width, android.view.View.MeasureSpec.EXACTLY),
                            android.view.View.MeasureSpec.makeMeasureSpec(0, android.view.View.MeasureSpec.UNSPECIFIED)
                        )
                        view.layout(0, 0, width, height)

                        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                        val canvas = android.graphics.Canvas(bitmap)
                        view.draw(canvas)

                        saveBitmap(bitmap, fileName)
                    }, 300)
                }
            }

            webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
        }

        delay(1200)
    }

    private fun saveBitmap(bitmap: Bitmap, fileName: String) {
        val dir = File(applicationContext.filesDir, "renders")
        if (!dir.exists()) dir.mkdirs()

        val file = File(dir, fileName)
        FileOutputStream(file).use {
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, it)
        }
    }
}
