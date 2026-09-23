package com.scanflow.scanner

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.ParcelFileDescriptor
import android.provider.MediaStore
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream

class PdfRendererModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "PdfRendererModule"
    }

    @ReactMethod
    fun renderPageToImage(
        pdfUriStr: String,
        pageNumber: Int, // 1-indexed
        outputFormat: String, // "JPG" or "PNG"
        destPath: String,
        quality: Int,
        promise: Promise
    ) {
        Thread {
            try {
                val tempPdfFile = getFileFromUri(pdfUriStr)
                val fileDescriptor = ParcelFileDescriptor.open(tempPdfFile, ParcelFileDescriptor.MODE_READ_ONLY)
                val pdfRenderer = PdfRenderer(fileDescriptor)

                val pageIndex = pageNumber - 1
                if (pageIndex < 0 || pageIndex >= pdfRenderer.pageCount) {
                    pdfRenderer.close()
                    fileDescriptor.close()
                    promise.reject("PAGE_OUT_OF_BOUNDS", "Page $pageNumber is out of bounds (Total: ${pdfRenderer.pageCount})")
                    return@Thread
                }

                val page = pdfRenderer.openPage(pageIndex)
                // 2.0x scale for crisp 300 DPI document clarity
                val scale = 2.0f
                val bmpWidth = (page.width * scale).toInt()
                val bmpHeight = (page.height * scale).toInt()

                val bitmap = Bitmap.createBitmap(bmpWidth, bmpHeight, Bitmap.Config.ARGB_8888)
                bitmap.eraseColor(Color.WHITE) // Clean white paper background
                page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                page.close()
                pdfRenderer.close()
                fileDescriptor.close()

                val cleanDestPath = if (destPath.startsWith("file://")) destPath.substring(7) else destPath
                val destFile = File(cleanDestPath)
                destFile.parentFile?.mkdirs()
                val outStream = FileOutputStream(destFile)

                val compressFormat = if (outputFormat.equals("PNG", ignoreCase = true)) {
                    Bitmap.CompressFormat.PNG
                } else {
                    Bitmap.CompressFormat.JPEG
                }
                bitmap.compress(compressFormat, quality, outStream)
                outStream.flush()
                outStream.close()
                bitmap.recycle()

                // Trigger MediaScanner so the image immediately appears in the Phone Gallery
                MediaScannerConnection.scanFile(
                    reactContext,
                    arrayOf(destFile.absolutePath),
                    arrayOf(if (outputFormat.equals("PNG", ignoreCase = true)) "image/png" else "image/jpeg"),
                    null
                )

                val result = Arguments.createMap()
                result.putString("uri", "file://${destFile.absolutePath}")
                result.putInt("width", bmpWidth)
                result.putInt("height", bmpHeight)
                result.putDouble("fileSize", destFile.length().toDouble())
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("RENDER_ERROR", e.message, e)
            }
        }.start()
    }

    @ReactMethod
    fun saveToDownloads(
        fileUriStr: String,
        fileName: String,
        mimeType: String,
        promise: Promise
    ) {
        Thread {
            try {
                val srcFile = getFileFromUri(fileUriStr)
                val isImage = mimeType.startsWith("image/")

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val contentValues = ContentValues().apply {
                        put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                        put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
                        put(MediaStore.MediaColumns.IS_PENDING, 1)
                        if (isImage) {
                            put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_PICTURES)
                        } else {
                            put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                        }
                    }

                    val collection = if (isImage) {
                        MediaStore.Images.Media.EXTERNAL_CONTENT_URI
                    } else {
                        MediaStore.Downloads.EXTERNAL_CONTENT_URI
                    }

                    val uri = reactContext.contentResolver.insert(collection, contentValues)
                    if (uri != null) {
                        reactContext.contentResolver.openOutputStream(uri)?.use { out ->
                            srcFile.inputStream().use { inp ->
                                inp.copyTo(out)
                            }
                        }

                        // Mark IS_PENDING as 0 so it immediately shows in Files & Gallery
                        contentValues.clear()
                        contentValues.put(MediaStore.MediaColumns.IS_PENDING, 0)
                        reactContext.contentResolver.update(uri, contentValues, null, null)

                        promise.resolve(uri.toString())
                        return@Thread
                    }
                }

                // Fallback for older Android versions or direct file storage
                val targetDir = if (isImage) {
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES)
                } else {
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                }
                targetDir.mkdirs()
                val targetFile = File(targetDir, fileName)
                srcFile.copyTo(targetFile, overwrite = true)

                MediaScannerConnection.scanFile(
                    reactContext,
                    arrayOf(targetFile.absolutePath),
                    arrayOf(mimeType),
                    null
                )
                promise.resolve("file://${targetFile.absolutePath}")
            } catch (e: Exception) {
                promise.reject("SAVE_ERROR", e.message, e)
            }
        }.start()
    }

    @ReactMethod
    fun getPageCount(pdfUriStr: String, promise: Promise) {
        Thread {
            try {
                val tempPdfFile = getFileFromUri(pdfUriStr)
                val fileDescriptor = ParcelFileDescriptor.open(tempPdfFile, ParcelFileDescriptor.MODE_READ_ONLY)
                val pdfRenderer = PdfRenderer(fileDescriptor)
                val count = pdfRenderer.pageCount
                pdfRenderer.close()
                fileDescriptor.close()
                promise.resolve(count)
            } catch (e: Exception) {
                promise.reject("PAGE_COUNT_ERROR", e.message, e)
            }
        }.start()
    }

    private fun getFileFromUri(uriStr: String): File {
        val uri = Uri.parse(uriStr)
        if (uri.scheme == "file") {
            return File(uri.path!!)
        }
        if (uriStr.startsWith("/")) {
            return File(uriStr)
        }
        // Handle content:// URIs from DocumentPicker
        val inputStream: InputStream? = reactContext.contentResolver.openInputStream(uri)
        val tempFile = File.createTempFile("pdf_render_temp_", ".pdf", reactContext.cacheDir)
        tempFile.deleteOnExit()
        val outputStream = FileOutputStream(tempFile)
        inputStream?.copyTo(outputStream)
        inputStream?.close()
        outputStream.close()
        return tempFile
    }
}
