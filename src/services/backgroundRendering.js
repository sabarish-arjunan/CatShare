import { saveRenderedImage } from "../Save";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { KeepAwake } from '@capacitor-community/keep-awake';

/**
 * Background Rendering Service
 * Handles PNG rendering in chunks to allow better app responsiveness
 * and graceful handling of backgrounding
 */

let renderingState = {
  isRendering: false,
  isCancelled: false,
  currentProductIndex: 0,
  totalProducts: 0,
  currentCatalogueIndex: 0,
  totalCatalogues: 0,
  renderStats: {
    successful: 0,
    failed: 0,
    failedProducts: []
  }
};

/**
 * Initialize background rendering with all products
 */
export async function startBackgroundRendering(products, catalogues, onProgress, onComplete, onError) {
  const isNative = Capacitor.getPlatform() !== "web";

  if (renderingState.isRendering) {
    console.warn("⚠️ Rendering already in progress");
    return;
  }

  renderingState.isRendering = true;
  renderingState.isCancelled = false;
  renderingState.currentProductIndex = 0;
  renderingState.totalProducts = products.length;
  renderingState.currentCatalogueIndex = 0;
  renderingState.totalCatalogues = catalogues.length;
  renderingState.renderStats = {
    successful: 0,
    failed: 0,
    failedProducts: []
  };

  try {
    // Keep device awake during rendering
    if (isNative) {
      try {
        await KeepAwake.keepAwake();
        console.log("✅ Device wakelock enabled");
      } catch (err) {
        console.warn("⚠️ Could not enable wakelock:", err);
      }
    }

    // Save initial state to localStorage for recovery if app crashes
    localStorage.setItem('renderingState', JSON.stringify(renderingState));

    // Process products in chunks to allow UI updates and backgrounding
    for (let i = 0; i < products.length; i++) {
      if (renderingState.isCancelled) {
        console.log("🛑 Rendering cancelled by user");
        break;
      }

      const product = products[i];
      renderingState.currentProductIndex = i;

      // Skip products without images
      if (!product.image && !product.imagePath) {
        console.warn(`⚠️ Skipping ${product.name} - no image available`);
        updateProgress(onProgress);
        continue;
      }

      try {
        // Render for each catalogue
        for (let j = 0; j < catalogues.length; j++) {
          if (renderingState.isCancelled) break;

          const cat = catalogues[j];
          renderingState.currentCatalogueIndex = j;

          try {
            const legacyType = cat.id === "cat1" ? "wholesale" : cat.id === "cat2" ? "resell" : cat.id;

            await saveRenderedImage(product, legacyType, {
              resellUnit: product.resellUnit || "/ piece",
              wholesaleUnit: product.wholesaleUnit || "/ piece",
              packageUnit: product.packageUnit || "pcs / set",
              ageGroupUnit: product.ageUnit || "months",
              catalogueId: cat.id,
              catalogueLabel: cat.label,
              folder: cat.folder || cat.label,
              priceField: cat.priceField,
              priceUnitField: cat.priceUnitField,
            });

            renderingState.renderStats.successful++;
            console.log(`✅ Rendered: ${product.name} - ${cat.label}`);

          } catch (catalogueError) {
            console.error(`❌ Failed to render ${product.name} for ${cat.label}:`, catalogueError);
            renderingState.renderStats.failed++;
            if (!renderingState.renderStats.failedProducts.includes(product.name)) {
              renderingState.renderStats.failedProducts.push(product.name);
            }
          }

          updateProgress(onProgress);
        }

        // Small delay between products to allow memory cleanup
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (productError) {
        console.error(`❌ Error processing ${product.name}:`, productError);
        renderingState.renderStats.failed++;
        if (!renderingState.renderStats.failedProducts.includes(product.name)) {
          renderingState.renderStats.failedProducts.push(product.name);
        }
      }

      updateProgress(onProgress);
    }

    // Rendering complete
    renderingState.isRendering = false;
    localStorage.removeItem('renderingState');

    // Release wakelock
    if (isNative) {
      try {
        await KeepAwake.allowSleep();
        console.log("✅ Device wakelock released");
      } catch (err) {
        console.warn("⚠️ Could not release wakelock:", err);
      }
    }

    // Build result message
    const totalProcessed = renderingState.renderStats.successful + renderingState.renderStats.failed;
    const resultMessage = buildResultMessage(renderingState.renderStats, totalProcessed);

    console.log("✅ Background rendering completed:", resultMessage);

    // Show notification
    if (isNative) {
      await sendBackgroundRenderingNotification(resultMessage, renderingState.renderStats.failed === 0);
    }

    // Call completion callback
    if (onComplete) {
      onComplete({
        status: renderingState.renderStats.failed === 0 ? "success" : "partial",
        message: resultMessage,
        stats: renderingState.renderStats
      });
    }

  } catch (error) {
    console.error("❌ Background rendering failed:", error);
    renderingState.isRendering = false;
    localStorage.removeItem('renderingState');

    if (onError) {
      onError(error);
    }
  }
}

/**
 * Cancel ongoing rendering
 */
export function cancelBackgroundRendering() {
  console.log("⏹️ Cancelling background rendering...");
  renderingState.isCancelled = true;
  localStorage.removeItem('renderingState');
}

/**
 * Get current rendering progress
 */
export function getRenderingProgress() {
  if (!renderingState.isRendering) return null;

  const totalItems = renderingState.totalProducts * renderingState.totalCatalogues;
  const completedItems = renderingState.currentProductIndex * renderingState.totalCatalogues + renderingState.currentCatalogueIndex;
  const percentage = Math.round((completedItems / totalItems) * 100);

  return {
    isRendering: true,
    percentage,
    current: completedItems,
    total: totalItems,
    currentProduct: renderingState.currentProductIndex + 1,
    totalProducts: renderingState.totalProducts,
    stats: renderingState.renderStats
  };
}

/**
 * Check if rendering was in progress before app crash/close
 */
export function checkResumableRendering() {
  const state = localStorage.getItem('renderingState');
  if (state) {
    try {
      return JSON.parse(state);
    } catch (err) {
      console.warn("⚠️ Could not parse rendering state:", err);
      localStorage.removeItem('renderingState');
    }
  }
  return null;
}

/**
 * Resume rendering from where it left off
 */
export async function resumeBackgroundRendering(products, catalogues, onProgress, onComplete, onError) {
  const resumableState = checkResumableRendering();
  if (!resumableState) {
    console.log("No resumable rendering state found");
    return false;
  }

  console.log("📋 Resuming previous rendering session...", resumableState);
  
  // Start from where we left off
  renderingState = resumableState;
  renderingState.isRendering = true;
  renderingState.isCancelled = false;

  // Filter to products not yet fully processed
  const remainingProducts = products.slice(resumableState.currentProductIndex);

  try {
    await startBackgroundRendering(remainingProducts, catalogues, onProgress, onComplete, onError);
    return true;
  } catch (error) {
    console.error("❌ Failed to resume rendering:", error);
    return false;
  }
}

/**
 * Update progress and save state
 */
function updateProgress(onProgress) {
  const progress = getRenderingProgress();
  localStorage.setItem('renderingState', JSON.stringify(renderingState));
  
  if (onProgress) {
    onProgress(progress);
  }
}

/**
 * Build user-friendly result message
 */
function buildResultMessage(stats, totalProcessed) {
  const { successful, failed, failedProducts } = stats;

  if (failed === 0) {
    return `✅ All ${successful} images rendered successfully!`;
  } else if (successful === 0) {
    return `❌ Rendering failed for all products`;
  } else {
    return `⚠️ Rendered ${successful}/${totalProcessed} images. ${failed} failed: ${failedProducts.join(", ")}`;
  }
}

/**
 * Send notification about background rendering completion
 */
async function sendBackgroundRenderingNotification(message, isSuccess) {
  const isNative = Capacitor.getPlatform() !== "web";
  if (!isNative) return;

  try {
    await LocalNotifications.createChannel({
      id: 'background_render_channel',
      name: 'Background Rendering',
      importance: 5,
      visibility: 1,
    });

    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Math.random() * 100000) + 1,
          title: isSuccess ? "Rendering Complete" : "Rendering Completed with Errors",
          body: message,
          channelId: 'background_render_channel',
          smallIcon: isSuccess ? "res://drawable/ic_stat_notify_success" : "res://drawable/ic_stat_notify_error",
        },
      ]
    });

    console.log("✅ Background rendering notification sent");
  } catch (error) {
    console.error("❌ Failed to send notification:", error);
  }
}
