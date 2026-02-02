package com.catshare.official.render

import android.content.Context
import android.util.Log
import java.io.File

/**
 * Utility class for handling file storage operations
 * Maps to Capacitor's Directory.External and Directory.Data
 */
object StorageUtils {

    private const val tag = "StorageUtils"

    /**
     * Get the Directory.External equivalent path
     * (/storage/emulated/0/Android/data/com.catshare.official/files/)
     */
    fun getExternalFilesDir(context: Context, subFolder: String? = null): File? {
        val baseDir = context.getExternalFilesDir(null)
        
        return if (baseDir != null && subFolder != null) {
            File(baseDir, subFolder).apply {
                if (!exists()) {
                    mkdirs()
                }
            }
        } else {
            baseDir
        }
    }

    /**
     * Get the Directory.Data equivalent path
     * (/data/data/com.catshare.official/files/)
     */
    fun getDataDir(context: Context, subFolder: String? = null): File? {
        val baseDir = context.filesDir
        
        return if (subFolder != null) {
            File(baseDir, subFolder).apply {
                if (!exists()) {
                    mkdirs()
                }
            }
        } else {
            baseDir
        }
    }

    /**
     * Save base64 data to file in external storage
     */
    fun saveBase64ToFile(
        context: Context,
        base64Data: String,
        filePath: String,
        folderName: String = "renders"
    ): Boolean {
        return try {
            val folder = getExternalFilesDir(context, folderName)
            if (folder == null) {
                Log.e(tag, "External files directory not available")
                return false
            }

            val file = File(folder, filePath)
            val binaryData = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)
            
            file.outputStream().use { out ->
                out.write(binaryData)
                out.flush()
            }
            
            Log.d(tag, "Saved file to: ${file.absolutePath}")
            true
        } catch (e: Exception) {
            Log.e(tag, "Error saving file", e)
            false
        }
    }

    /**
     * Read file from external storage
     */
    fun readFileFromStorage(
        context: Context,
        filePath: String,
        folderName: String = "renders"
    ): ByteArray? {
        return try {
            val folder = getExternalFilesDir(context, folderName)
            if (folder == null) {
                Log.e(tag, "External files directory not available")
                return null
            }

            val file = File(folder, filePath)
            if (!file.exists()) {
                Log.w(tag, "File not found: ${file.absolutePath}")
                return null
            }

            file.inputStream().use { input ->
                input.readBytes()
            }
        } catch (e: Exception) {
            Log.e(tag, "Error reading file", e)
            null
        }
    }

    /**
     * Delete file from external storage
     */
    fun deleteFile(
        context: Context,
        filePath: String,
        folderName: String = "renders"
    ): Boolean {
        return try {
            val folder = getExternalFilesDir(context, folderName)
            if (folder == null) {
                Log.e(tag, "External files directory not available")
                return false
            }

            val file = File(folder, filePath)
            if (file.exists()) {
                file.delete().also { success ->
                    if (success) {
                        Log.d(tag, "Deleted file: ${file.absolutePath}")
                    } else {
                        Log.w(tag, "Failed to delete file: ${file.absolutePath}")
                    }
                }
            } else {
                Log.w(tag, "File not found: ${file.absolutePath}")
                false
            }
        } catch (e: Exception) {
            Log.e(tag, "Error deleting file", e)
            false
        }
    }

    /**
     * List files in a folder
     */
    fun listFiles(
        context: Context,
        folderName: String = "renders"
    ): List<String> {
        return try {
            val folder = getExternalFilesDir(context, folderName) ?: return emptyList()
            folder.listFiles()?.map { it.name } ?: emptyList()
        } catch (e: Exception) {
            Log.e(tag, "Error listing files", e)
            emptyList()
        }
    }

    /**
     * Get total size of files in a folder
     */
    fun getFolderSize(
        context: Context,
        folderName: String = "renders"
    ): Long {
        return try {
            val folder = getExternalFilesDir(context, folderName) ?: return 0L
            folder.walkTopDown()
                .filter { it.isFile }
                .map { it.length() }
                .sum()
        } catch (e: Exception) {
            Log.e(tag, "Error calculating folder size", e)
            0L
        }
    }

    /**
     * Clear all files in a folder
     */
    fun clearFolder(
        context: Context,
        folderName: String = "renders"
    ): Boolean {
        return try {
            val folder = getExternalFilesDir(context, folderName) ?: return false
            folder.deleteRecursively().also { success ->
                if (success) {
                    folder.mkdirs() // Recreate empty folder
                    Log.d(tag, "Cleared folder: $folderName")
                }
            }
        } catch (e: Exception) {
            Log.e(tag, "Error clearing folder", e)
            false
        }
    }
}
