import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { getRenderedImage, renderProductImageOnTheFly } from "./utils/renderingUtils";
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

  // 1. Identify products that need rendering using the native engine
  const missingProducts = [];
  for (const id of selected) {
    try {
      const cachedFileName = `product_${id}_${catalogueLabel}.png`;
      const cachedFilePath = `${targetFolder}/${cachedFileName}`;
      await Filesystem.stat({
        path: cachedFilePath,
        directory: Directory.External,
      });
    } catch (err) {
      // File not found on disk, need to render
      const product = allProducts.find((p: any) => String(p.id) === String(id));
      if (product) missingProducts.push(product);
    }
  }

  // 2. If any missing, trigger native rendering (same as Render All) and wait
  if (missingProducts.length > 0) {
    console.log(`🎨 ${missingProducts.length} products missing rendered images. Triggering native rendering...`);

    // Emit event that App.tsx listens to
    window.dispatchEvent(new CustomEvent("requestRenderSelectedPNGs", {
      detail: { products: missingProducts }
    }));

    // Wait for the renderComplete event from App.tsx
    await new Promise<void>((resolve) => {
      const handler = () => {
        window.removeEventListener("renderComplete", handler);
        resolve();
      };
      window.addEventListener("renderComplete", handler);
    });

    console.log("✅ Native rendering complete, proceeding with sharing...");
  }

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
        // Get URI for the file on disk
        const fileResult = await Filesystem.getUri({
          path: cachedFilePath,
          directory: Directory.External,
        });

        if (fileResult.uri) {
          updateProgress();
          return fileResult.uri;
        }
      } catch (err) {
        console.warn(`⚠️ Could not get URI for product ${id}:`, err);
        // Fallback to base64 if URI fails (though shouldn't happen after render)
        const imageDataUrl = await getRenderedImage(id, catalogueLabel);
        updateProgress();
        return imageDataUrl;
      }
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
    alert("❌ No products selected or no valid images available to share.\n\nPlease ensure you have:\n1. Selected at least one product\n2. That product has an image\n\nFailed products: " + failedProducts.join(", "));
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
