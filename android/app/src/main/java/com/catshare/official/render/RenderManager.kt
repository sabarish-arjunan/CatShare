package com.catshare.official.render

import android.content.Context
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf

object RenderManager {

    fun enqueue(context: Context, html: String, fileName: String) {
        val request = OneTimeWorkRequestBuilder<CatalogueRenderWorker>()
            .setInputData(
                workDataOf(
                    "html" to html,
                    "fileName" to fileName
                )
            )
            .build()

        WorkManager.getInstance(context).enqueue(request)
    }
}
