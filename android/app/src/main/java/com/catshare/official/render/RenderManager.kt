package com.catshare.official.render

import android.content.Context
import android.content.Intent
import androidx.work.BackoffPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf
import java.util.concurrent.TimeUnit

object RenderManager {

    /**
     * Enqueue a single product render job
     */
    fun enqueue(context: Context, html: String, fileName: String, folderName: String = "renders") {
        val request = OneTimeWorkRequestBuilder<CatalogueRenderWorker>()
            .setInputData(
                workDataOf(
                    "html" to html,
                    "fileName" to fileName,
                    "folderName" to folderName
                )
            )
            .setBackoffCriteria(
                BackoffPolicy.EXPONENTIAL,
                1,
                TimeUnit.MINUTES
            )
            .build()

        WorkManager.getInstance(context).enqueue(request)
    }

    /**
     * Enqueue multiple product render jobs (batch rendering)
     */
    fun enqueueBatch(
        context: Context,
        renderJobs: List<RenderJob>,
        folderName: String = "renders"
    ) {
        val requests = renderJobs.map { job ->
            OneTimeWorkRequestBuilder<CatalogueRenderWorker>()
                .setInputData(
                    workDataOf(
                        "html" to job.html,
                        "fileName" to job.fileName,
                        "folderName" to folderName
                    )
                )
                .setBackoffCriteria(
                    BackoffPolicy.EXPONENTIAL,
                    1,
                    TimeUnit.MINUTES
                )
                .build()
        }

        WorkManager.getInstance(context).enqueueUniqueWork(
            "batch_render_${System.currentTimeMillis()}",
            androidx.work.ExistingWorkPolicy.KEEP,
            requests[0]
        )

        // Enqueue the rest
        if (requests.size > 1) {
            WorkManager.getInstance(context).enqueue(requests.drop(1))
        }
    }

    /**
     * Cancel all pending render jobs
     */
    fun cancelAll(context: Context) {
        WorkManager.getInstance(context).cancelAllWork()
    }

    /**
     * Trigger background rendering service
     */
    fun startBackgroundRendering(context: Context) {
        val intent = Intent(context, BackgroundRenderingService::class.java)
        context.startService(intent)
    }
}

/**
 * Data class for render jobs
 */
data class RenderJob(
    val html: String,
    val fileName: String
)
