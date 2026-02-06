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
}

export async function handleShare({
  selected,
  setProcessing,
  setProcessingIndex,
  setProcessingTotal,
  folder = null,
  mode = "resell", // or "wholesale" - kept for backward compatibility
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
  let processedCount = 0;

  // Extract catalogue label from folder (folder is the catalogue name/label)
  // Used for filename pattern: product_<id>_<catalogueLabel>.png
  const catalogueLabel = targetFolder;

  console.log(`🔍 Share Debug Info:`);
  console.log(`📁 Target folder: ${targetFolder}`);
  console.log(`📁 Catalogue label (for filename): ${catalogueLabel}`);
  console.log(`🔢 Products to share: ${selected.length}`);
  console.log(`📍 Looking for files in Directory.External/${targetFolder}/`);
  console.log(`📍 Android path: /storage/emulated/0/Android/data/com.catshare.official/files/${targetFolder}/`);
  console.log(`Selected product IDs: ${selected.join(", ")}`);

  // Get all products to support on-the-fly rendering
  const allProducts = JSON.parse(localStorage.getItem("products") || "[]");

  for (const id of selected) {
    try {
      console.log(`📦 Processing product ${id} for sharing...`);

      // First try to get pre-rendered image
      let imageDataUrl = await getRenderedImage(id, catalogueLabel);

      // If not rendered, render on-the-fly
      if (!imageDataUrl) {
        console.log(`⏳ Image not rendered yet, rendering on-the-fly...`);
        const product = allProducts.find((p: any) => p.id === id);

        if (!product) {
          console.error(`❌ Product not found: ${id}`);
          processedCount++;
          setProcessingIndex(processedCount);
          continue;
        }

        // Determine catalogue ID from folder/mode
        let catalogueId = folder === "Wholesale" ? "cat1" : folder === "Retail" ? "cat2" : "cat2";
        imageDataUrl = await renderProductImageOnTheFly(product, catalogueLabel, catalogueId);

        if (!imageDataUrl) {
          console.warn(`⚠️ Could not render product ${id} - product may not have an image`);
          processedCount++;
          setProcessingIndex(processedCount);
          continue;
        }

        // Store on-the-fly rendered image in localStorage for future use
        try {
          const base64Data = imageDataUrl.replace(/^data:image\/png;base64,/, "");
          const storageKey = `rendered::${catalogueLabel}::${id}`;
          localStorage.setItem(storageKey, JSON.stringify({
            base64: base64Data,
            timestamp: Date.now(),
            filename: `product_${id}_${catalogueLabel}.png`,
            catalogueLabel,
          }));
          console.log(`💾 Stored on-the-fly rendered image in localStorage: ${storageKey}`);
        } catch (storageErr) {
          console.warn(`⚠️ Could not store rendered image in localStorage:`, storageErr);
        }

        console.log(`✅ Product ${id} rendered on-the-fly successfully and cached`);
      }

      // Convert data URL to file URI for better Share API compatibility
      try {
        const base64Data = imageDataUrl.replace(/^data:image\/png;base64,/, "");
        const tempFileName = `share_temp_${id}_${Date.now()}.png`;
        const tempFilePath = `${targetFolder}/${tempFileName}`;

        await Filesystem.writeFile({
          path: tempFilePath,
          data: base64Data,
          directory: Directory.External,
        });

        const fileResult = await Filesystem.getUri({
          path: tempFilePath,
          directory: Directory.External,
        });

        if (fileResult.uri) {
          fileUris.push(fileResult.uri);
          console.log(`✅ Added image for product ${id} to share queue (temp file URI)`);
        } else {
          // Fallback to data URL if URI not available
          fileUris.push(imageDataUrl);
          console.log(`✅ Added image for product ${id} to share queue (data URL fallback)`);
        }
      } catch (writeErr) {
        console.warn(`⚠️ Could not write temp file for product ${id}, using data URL fallback:`, writeErr);
        fileUris.push(imageDataUrl);
        console.log(`✅ Added image for product ${id} to share queue (data URL fallback)`);
      }
    } catch (err) {
      console.error(`❌ Error processing product ${id}:`, err);
    }

    processedCount++;
    setProcessingIndex(processedCount);
  }

  setProcessing(false);

  if (fileUris.length === 0) {
    alert("❌ No products selected or no valid images available to share.\n\nPlease ensure you have:\n1. Selected at least one product\n2. That product has an image");
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
