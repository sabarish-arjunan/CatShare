import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
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

  // 1. Identify products that need rendering (only if they don't have any images)
  const missingProducts = [];
  const productsWithoutRendered = [];

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
      // Rendered image exists, all good
    } catch (err) {
      // Rendered image not found
      if (product.image || product.imagePath) {
        // Has original image, can share as-is
        productsWithoutRendered.push(product);
        console.log(`ℹ️ Product ${product.name} will be shared with original image (not rendered)`);
      } else {
        // No image at all, needs rendering
        missingProducts.push(product);
      }
    }
  }

  // 2. Only trigger rendering if there are products with NO images at all
  if (missingProducts.length > 0) {
    console.log(`🎨 ${missingProducts.length} products have no images. Triggering rendering...`);

    // Set processing states to show progress in CatalogueView
    setProcessing(true);
    setProcessingIndex(0);
    setProcessingTotal(missingProducts.length);

    // Emit event that App.tsx listens to, with request to hide global overlay
    window.dispatchEvent(new CustomEvent("requestRenderSelectedPNGs", {
      detail: {
        products: missingProducts,
        showOverlay: false
      }
    }));

    // Listen for progress events from the renderer
    const progressHandler = (event: any) => {
      const { current, total } = event.detail;
      setProcessingIndex(current);
      setProcessingTotal(total);
    };
    window.addEventListener("renderProgress", progressHandler);

    // Wait for the renderComplete event
    await new Promise<void>((resolve) => {
      const completionHandler = () => {
        window.removeEventListener("renderComplete", completionHandler);
        window.removeEventListener("renderProgress", progressHandler);
        resolve();
      };
      window.addEventListener("renderComplete", completionHandler);
    });

    console.log("✅ Rendering complete, proceeding with sharing...");
  }

  if (productsWithoutRendered.length > 0) {
    console.log(`ℹ️ ${productsWithoutRendered.length} product(s) will be shared with original images (not rendered)`);
  }

  // Reset processing for the actual share preparation step
  setProcessingIndex(0);
  setProcessingTotal(selected.length);

  // Process all products to get their file URIs
  let completedCount = 0;
  const updateProgress = () => {
    completedCount++;
    setProcessingIndex(completedCount);
  };

  const processingPromises = selected.map(async (id) => {
    try {
      const cachedFileName = `product_${id}_${catalogueLabel}.png`;
      const cachedFilePath = `${targetFolder}/${cachedFileName}`;

      try {
        // First, try to get the rendered image
        const fileResult = await Filesystem.getUri({
          path: cachedFilePath,
          directory: Directory.External,
        });

        if (fileResult.uri) {
          updateProgress();
          return fileResult.uri;
        }
      } catch (err) {
        console.warn(`⚠️ Could not get rendered URI for product ${id}, falling back to original image:`, err);

        // Fallback 1: Try to get the rendered image as base64
        try {
          const imageDataUrl = await getRenderedImage(id, catalogueLabel);
          if (imageDataUrl) {
            updateProgress();
            return imageDataUrl;
          }
        } catch (renderErr) {
          console.warn(`⚠️ Could not get rendered image for product ${id}:`, renderErr);
        }

        // Fallback 2: Use original product image if available
        const product = allProducts.find((p: any) => String(p.id) === String(id));
        if (product && product.image) {
          console.log(`✅ Using original product image for product ${id} (not rendered)`);
          updateProgress();
          return product.image; // Return base64 image directly
        }

        // Fallback 3: Try to load from imagePath
        if (product && product.imagePath) {
          try {
            console.log(`📂 Loading original image from filesystem for product ${id}`);
            const res = await Filesystem.readFile({
              path: product.imagePath,
              directory: Directory.Data,
            });
            const imageData = `data:image/png;base64,${res.data}`;
            updateProgress();
            return imageData;
          } catch (pathErr) {
            console.warn(`⚠️ Could not load image from path for product ${id}:`, pathErr);
          }
        }
      }

      updateProgress();
      return null;
    } catch (err) {
      console.error(`❌ Error processing product ${id}:`, err);
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
    console.error(`❌ Share failed: No valid images to share. Failed products:`, failedProducts);
    alert("❌ Cannot share: No products with images available.\n\nPlease ensure you have:\n1. Selected at least one product\n2. That product has an image (original or rendered)\n\nFailed products: " + failedProducts.join(", "));
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
