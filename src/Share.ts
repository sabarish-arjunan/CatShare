import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { flushSync } from "react-dom";
import { getRenderedImage } from "./utils/renderingUtils";
import { safeGetFromStorage } from "./utils/safeStorage";

interface HandleShareParams {
  selected: any[];
  setProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  setProcessingIndex: React.Dispatch<React.SetStateAction<number>>;
  setProcessingTotal: React.Dispatch<React.SetStateAction<number>>;
  folder?: string | null;
  mode?: string;
  products?: any[]; // Optional: pass actual product objects instead of relying on localStorage
}

export async function handleShare({
  selected,
  setProcessing,
  setProcessingIndex,
  setProcessingTotal,
  folder = null,
  mode = "resell", // or "wholesale" - kept for backward compatibility
  products = undefined,
}: HandleShareParams) {
  if (!selected || selected.length === 0) {
    alert("No products selected.");
    return;
  }

  setProcessing(true);
  setProcessingTotal(selected.length);

  // Use the provided folder name, or derive from mode for backward compatibility
  const targetFolder = folder || (mode === "wholesale" ? "Wholesale" : mode === "retail" ? "Retail" : "Resell");
  const fileUris = [];

  // Extract catalogue label from folder (folder is the catalogue name/label)
  const catalogueLabel = targetFolder;

  // Get all products to support selective rendering
  let allProducts = products || JSON.parse(localStorage.getItem("products") || "[]");
  if (!products && (mode === "retail" || mode === "cat2")) {
    const retailProducts = JSON.parse(localStorage.getItem("retailProducts") || "[]");
    if (retailProducts.length > 0) {
      allProducts = [...retailProducts, ...allProducts];
    }
  }

  // ✅ Load images for all products first - this is critical for rendering
  console.log(`📂 Pre-loading images for ${allProducts.length} products before rendering...`);
  await loadProductImages(allProducts);
  console.log(`✅ Images pre-loaded. Products with images: ${allProducts.filter((p: any) => p.image).length}`);

  // Helper function to load image data from filesystem for a product
  const loadProductImages = async (productsToLoad: any[]) => {
    console.log(`📂 Loading images for ${productsToLoad.length} products...`);
    for (const product of productsToLoad) {
      // Skip if image is already loaded as base64
      if (product.image) {
        console.log(`✅ Product ${product.id} already has image loaded`);
        continue;
      }

      // Try to load from filesystem if imagePath is available
      if (product.imagePath) {
        try {
          console.log(`📂 Loading image from filesystem: ${product.imagePath}`);
          const res = await Filesystem.readFile({
            path: product.imagePath,
            directory: Directory.Data,
          });
          product.image = `data:image/png;base64,${res.data}`;
          console.log(`✅ Image loaded for product ${product.id}`);
        } catch (err) {
          console.warn(`⚠️ Failed to load image for product ${product.id}: ${err.message}`);
          // Don't fail - the render function will handle missing images
        }
      }
    }
  };

  // 1. Identify products that don't have rendered images for this catalogue
  const needsRendering = [];

  for (const id of selected) {
    const product = allProducts.find((p: any) => String(p.id) === String(id));
    if (!product) continue;

    try {
      const cachedFileName = `product_${id}_${catalogueLabel}.png`;
      const cachedFilePath = `${targetFolder}/${cachedFileName}`;
      await Filesystem.stat({
        path: cachedFilePath,
        directory: Directory.External,
      });
      // Rendered image exists, all good - no rendering needed
      console.log(`✅ Rendered image already exists for ${product.name}`);
    } catch (err) {
      // Rendered image not found - needs rendering
      if (product.image || product.imagePath) {
        // Has image, can render
        needsRendering.push(product);
        console.log(`🎨 Product ${product.name} needs rendering for ${catalogueLabel}`);
      } else {
        // No image at all
        console.warn(`⚠️ Product ${product.name} has no image, cannot share or render`);
      }
    }
  }

  // 2. Trigger rendering for any products missing rendered images
  if (needsRendering.length > 0) {
    console.log(`🎨 ${needsRendering.length} products need rendering. Triggering rendering...`);

    // Set processing states to show progress in CatalogueView
    setProcessing(true);
    setProcessingIndex(0);
    setProcessingTotal(needsRendering.length);

    // Wait a moment to ensure the modal renders before we set up listeners and start rendering
    await new Promise(resolve => setTimeout(resolve, 50));

    console.log("✅ Modal visible, setting up event listeners");

    // Set up event listeners BEFORE dispatching the event
    const progressHandler = (event: any) => {
      const { current, total } = event.detail;
      console.log(`📊 Share.ts renderProgress: ${current}/${total}`);
      // Update state directly without flushSync (CatalogueView will re-render)
      setProcessingIndex(current);
      setProcessingTotal(total);
    };

    const completionPromise = new Promise<void>((resolve) => {
      const completionHandler = () => {
        console.log("✅ renderComplete event received in Share.ts");
        window.removeEventListener("renderComplete", completionHandler);
        window.removeEventListener("renderProgress", progressHandler);
        resolve();
      };
      window.addEventListener("renderComplete", completionHandler);
    });

    // Listen for progress events BEFORE triggering rendering
    window.addEventListener("renderProgress", progressHandler);
    console.log("📢 Progress listener attached");

    // NOW emit event that App.tsx listens to, with request to hide global overlay
    console.log("📤 Dispatching requestRenderSelectedPNGs event with " + needsRendering.length + " products");
    window.dispatchEvent(new CustomEvent("requestRenderSelectedPNGs", {
      detail: {
        products: needsRendering,
        showOverlay: false
      }
    }));

    // Wait for the renderComplete event
    await completionPromise;

    console.log("✅ Rendering complete, proceeding with sharing...");
  }

  // Reset processing for the actual share preparation step
  setProcessingIndex(0);
  setProcessingTotal(selected.length);

  // Process all products to get their rendered file URIs
  let completedCount = 0;
  const updateProgress = () => {
    completedCount++;
    setProcessingIndex(completedCount);
  };

  const processingPromises = selected.map(async (id) => {
    try {
      const cachedFileName = `product_${id}_${catalogueLabel}.png`;
      const cachedFilePath = `${targetFolder}/${cachedFileName}`;

      // Get the rendered image file URI
      const fileResult = await Filesystem.getUri({
        path: cachedFilePath,
        directory: Directory.External,
      });

      if (fileResult.uri) {
        updateProgress();
        return fileResult.uri;
      }

      // If URI not available, try to get as base64
      const imageDataUrl = await getRenderedImage(id, catalogueLabel);
      updateProgress();
      return imageDataUrl;
    } catch (err) {
      console.error(`❌ Error getting rendered image for product ${id}:`, err);
      updateProgress();
      return null;
    }
  });

  const results = await Promise.all(processingPromises);
  const failedProducts = [];

  results.forEach((uri, index) => {
    if (uri) {
      fileUris.push(uri);
    } else {
      failedProducts.push(selected[index]);
    }
  });

  setProcessing(false);

  if (fileUris.length === 0) {
    console.error(`❌ Share failed: No rendered images available. Failed products:`, failedProducts);
    alert("❌ Cannot share: No rendered images available.\n\nPlease ensure you have:\n1. Selected at least one product\n2. That product has an image\n\nThe app will automatically render products before sharing. If rendering failed, please:\n- Check that products have images\n- Try rendering manually first\n\nFailed products: " + failedProducts.join(", "));
    return;
  }

  try {
    console.log(`\n📤 Preparing to share:`);
    console.log(`   Files collected: ${fileUris.length}`);
    fileUris.forEach((uri, idx) => {
      console.log(`   [${idx + 1}] ${uri.substring(0, 100)}${uri.length > 100 ? '...' : ''}`);
    });

    // Try native Share API first (works on mobile)
    try {
      await Share.share({
        files: fileUris,
        dialogTitle: "Share Products",
      });

      console.log("✅ Share successful!", fileUris.length, "products");
      console.log(`\n📊 Summary: Successfully shared ${fileUris.length} out of ${selected.length} selected products`);
    } catch (nativeShareErr) {
      console.warn("⚠️ Native Share API failed, attempting fallback...", nativeShareErr);

      // Fallback: For web environments or when native share is unavailable
      // Try using Web Share API if available
      if (navigator.share && fileUris.length > 0) {
        try {
          // Try web share API
          const dataUrl = fileUris[0]; // Use first image
          if (dataUrl.startsWith('data:')) {
            // Convert data URL to blob
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], `product_${Date.now()}.png`, { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: 'CatShare Products',
                text: `Sharing ${fileUris.length} product${fileUris.length > 1 ? 's' : ''}`,
              });
              console.log("✅ Web Share API successful!");
            } else {
              throw new Error('Web Share API cannot share files');
            }
          } else {
            // Try sharing as URL if it's a file URI
            await navigator.share({
              title: 'CatShare Products',
              text: `Sharing ${fileUris.length} product${fileUris.length > 1 ? 's' : ''}`,
              url: window.location.href,
            });
            console.log("✅ Web Share API successful (URL fallback)!");
          }
        } catch (webShareErr) {
          console.warn("⚠️ Web Share API also failed, trying download fallback...", webShareErr);

          // Final fallback: Download the first image as a file
          if (fileUris.length > 0 && fileUris[0].startsWith('data:')) {
            const link = document.createElement('a');
            link.href = fileUris[0];
            link.download = `product_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log("✅ Downloaded image as fallback");
            alert(`✅ Image download started!\n\nNote: ${fileUris.length} product${fileUris.length > 1 ? 's' : ''} ready. Use your device's native share option from the downloaded file.`);
          } else {
            throw webShareErr;
          }
        }
      } else {
        // No Share API available, use download fallback
        if (fileUris.length > 0 && fileUris[0].startsWith('data:')) {
          const link = document.createElement('a');
          link.href = fileUris[0];
          link.download = `product_${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          console.log("✅ Downloaded image as fallback (no Share API)");
          alert(`✅ Image download started!\n\nNote: ${fileUris.length} product${fileUris.length > 1 ? 's' : ''} ready. Use your device's native share option from the downloaded file.`);
        } else {
          throw new Error('No Share API available and unable to download files');
        }
      }
    }
  } catch (err) {
    console.error("❌ Share/Download failed:", err);
    console.log(`\n📊 Share Summary: Successfully prepared ${fileUris.length} files but share was cancelled or failed`);
    alert("Sharing failed: " + (err as Error).message + "\n\nTry saving the image and share it manually using your device's sharing options.");
  }
}
