# Android Native Image Rendering Setup

This document explains how to use the native Android (Kotlin) image rendering capabilities in CatShare.

## Overview

The Android rendering system consists of:

1. **CatalogueRenderWorker.kt** - Renders HTML to PNG using WebView (background task)
2. **RenderManager.kt** - Manages queuing and batch rendering jobs
3. **CatalogueRenderPlugin.kt** - Capacitor plugin bridge between React and Kotlin
4. **BackgroundRenderingService.kt** - Service that handles rendering when app is closed
5. **BootReceiver.kt** - Automatically triggers rendering on device boot
6. **StorageUtils.kt** - Utility for file operations
7. **androidRendering.ts** - React/TypeScript wrapper for easy integration

## File Structure

```
android/
├── app/src/main/java/com/catshare/official/render/
│   ├── CatalogueRenderWorker.kt          ✅ Updated
│   ├── CatalogueRenderPlugin.kt          ✅ Updated
│   ├── RenderManager.kt                  ✅ Updated
│   ├── BackgroundRenderingService.kt     ✨ New
│   ├── BootReceiver.kt                   ✨ New
│   └── StorageUtils.kt                   ✨ New
└── AndroidManifest.xml                   ✅ Updated

src/services/
└── androidRendering.ts                   ✨ New (React bridge)
```

## Key Features

### ✅ Single Image Rendering
Render a single product image in the background.

```typescript
import AndroidRenderingService from '@/services/androidRendering';

await AndroidRenderingService.renderImage(
  htmlContent,
  'product_123_Master.png',
  'Master' // catalogue folder
);
```

### ✅ Batch Rendering
Render multiple product images at once (more efficient).

```typescript
const jobs = products.map(p => ({
  html: generateProductHTML(p),
  fileName: `product_${p.id}_Master.png`
}));

await AndroidRenderingService.renderBatch(jobs, 'Master');
```

### ✅ Background Rendering (App Closed)
Continue rendering even when the app is completely closed.

```typescript
// Save render jobs before app closes
const pendingJobs = products.map(p => ({
  html: generateProductHTML(p),
  fileName: `product_${p.id}_Master.png`
}));

AndroidRenderingService.savePendingRenderJobs(pendingJobs);

// Start background service
await AndroidRenderingService.startBackgroundRendering();
```

## How It Works

### Rendering Flow

```
React App
    ↓
AndroidRenderingService.renderImage()
    ↓
CatalogueRenderPlugin.render()
    ↓
RenderManager.enqueue()
    ↓
WorkManager (background task queue)
    ↓
CatalogueRenderWorker.doWork()
    ↓
WebView renders HTML
    ↓
Bitmap created from WebView
    ↓
PNG saved to: /storage/emulated/0/Android/data/com.catshare.official/files/[folder]/
```

### Storage Locations

Images are saved to the app-specific external storage:
- **Directory**: `/storage/emulated/0/Android/data/com.catshare.official/files/`
- **Folders**: Organized by catalogue name (Master, Retail, etc.)
- **Files**: `product_{id}_{catalogueLabel}.png`

This is equivalent to Capacitor's `Directory.External`.

### Background Rendering When App Closed

1. **App Running** - Render jobs queued with WorkManager
2. **App Closes** - Pending jobs saved to SharedPreferences
3. **Device Boot** - BootReceiver triggers BackgroundRenderingService
4. **Service Starts** - Reads pending jobs from SharedPreferences
5. **Rendering Continues** - WorkManager executes all queued jobs
6. **Cleanup** - Pending jobs removed after completion

## Integration with Current Rendering Code

### Option 1: Direct Integration (Recommended)

Update `src/services/backgroundRendering.js` to use Android native rendering:

```typescript
import AndroidRenderingService from '@/services/androidRendering';
import { Capacitor } from '@capacitor/core';

export async function startBackgroundRendering(all, catalogues, onProgress, onComplete, onError) {
  const isNative = Capacitor.getPlatform() !== 'web';
  
  if (isNative) {
    // Use native Android rendering
    const renderJobs = all.map((product, index) => {
      const html = generateProductHTML(product); // Your existing HTML generation
      return {
        html,
        fileName: `product_${product.id}_Master.png`
      };
    });

    try {
      // Save for background rendering
      AndroidRenderingService.savePendingRenderJobs(renderJobs);
      
      // Start background service
      await AndroidRenderingService.startBackgroundRendering();
      
      // Update UI with progress
      onProgress({ percentage: 100 });
      onComplete({ status: 'success', message: 'Rendering started in background' });
    } catch (error) {
      onError(error);
    }
  } else {
    // Fallback to web-based rendering
    // ... existing web rendering code ...
  }
}
```

### Option 2: Gradual Migration

Keep existing web rendering, use Android native for foreground only:

```typescript
if (isNative && appIsActive) {
  // Use fast native rendering when app is visible
  await AndroidRenderingService.renderBatch(jobs);
} else {
  // Use web rendering as fallback
  // ... existing code ...
}
```

## Permissions Required

The following permissions are added to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" />
```

**User Permissions:**
- POST_NOTIFICATIONS - For progress notifications
- RECEIVE_BOOT_COMPLETED - For auto-rendering on device boot
- Storage permissions - For saving rendered images

## Android Version Support

- **Minimum SDK**: 21 (Android 5.0)
- **Target SDK**: 34 (Android 14)
- **Tested on**: Android 11+

## Build and Deploy

### Prerequisites
1. Android Studio 2023.1 or newer
2. Kotlin 1.9+
3. Gradle 8.0+

### Build Steps

```bash
# Install dependencies
npm install

# Build for Android
npm run build
npx cap sync android

# Open Android Studio
cd android
open -a "Android Studio" .

# In Android Studio:
# 1. Wait for Gradle sync to complete
# 2. Build → Make Project (Ctrl+F9)
# 3. Run → Run 'app' (Shift+F10)
```

### Build for Release

```bash
# Build release APK
cd android
./gradlew assembleRelease

# Sign APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore ~/my-release-key.jks \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  alias_name

# Align APK
zipalign -v 4 \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  app/build/outputs/apk/release/app-release.apk
```

## Troubleshooting

### Issue: Rendering not starting

**Solution:**
```kotlin
// Check if service is registered in AndroidManifest.xml
// Check logs: adb logcat | grep "CatalogueRender"
```

### Issue: Images not saved

**Solution:**
```kotlin
// Verify directory exists
val dir = context.getExternalFilesDir(null)
Log.d("Storage", "External files dir: ${dir?.absolutePath}")

// Check permissions granted
adb shell dumpsys package com.catshare.official
```

### Issue: Background rendering not working

**Solution:**
1. Check device battery optimization settings
2. Disable battery saver mode
3. Ensure BootReceiver permission is granted
4. Check logcat: `adb logcat | grep "BootReceiver"`

### Issue: Memory/OutOfMemory errors

**Solution:**
```kotlin
// In CatalogueRenderWorker, reduce WebView size:
val width = 720  // Instead of 1080
val height = view.contentHeight.coerceAtMost(1440)  // Add max height
```

## Performance Tips

1. **Batch Rendering**: Use `renderBatch()` instead of multiple `renderImage()` calls
2. **Reduce Image Size**: Consider 720px width for faster rendering
3. **App-Specific Storage**: Uses app cache, not device storage (faster)
4. **Background Tasks**: Let WorkManager handle scheduling (better for battery)

## API Reference

### CatalogueRenderPlugin (Kotlin)

```kotlin
// Single render
CatalogueRenderPlugin.render(PluginCall: {
  html: String,      // HTML content to render
  fileName: String,  // Output filename
  folderName: String // Optional: folder name
})

// Batch render
CatalogueRenderPlugin.renderBatch(PluginCall: {
  renderJobs: Array[{html, fileName}],
  folderName: String
})

// Background rendering
CatalogueRenderPlugin.startBackgroundRendering(PluginCall)

// Cancel
CatalogueRenderPlugin.cancelRenders(PluginCall)
```

### AndroidRenderingService (TypeScript)

```typescript
// Single image
await AndroidRenderingService.renderImage(html, fileName, folderName?)

// Batch
await AndroidRenderingService.renderBatch(jobs, folderName?)

// Background
await AndroidRenderingService.startBackgroundRendering()
await AndroidRenderingService.savePendingRenderJobs(jobs)

// Cancel
await AndroidRenderingService.cancelAllRenders()
```

## Future Enhancements

- [ ] Progress notifications during rendering
- [ ] Pause/Resume rendering jobs
- [ ] Rendering priority queue
- [ ] Analytics for rendering performance
- [ ] Custom watermark rendering in Kotlin
- [ ] Support for image galleries (multiple images per product)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Android Studio logs: `adb logcat | grep CatalogueRender`
3. Check GitHub issues for similar problems

---

**Last Updated**: 2024
**Version**: 2.1.3
**Author**: CatShare Development Team
