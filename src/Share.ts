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
  let filesNotFound = [];

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

        console.log(`✅ Product ${id} rendered on-the-fly successfully`);
      }

      fileUris.push(imageDataUrl);
      console.log(`✅ Added image for product ${id} to share queue`);
    } catch (err) {
      console.error(`❌ Error processing product ${id}:`, err);
    }

    processedCount++;
    setProcessingIndex(processedCount);
  }

  // Log diagnostic info if files weren't found
  if (filesNotFound.length > 0) {
    console.error("📋 Files not found for sharing:", filesNotFound);
    console.log("💡 Hint: Make sure images have been rendered first by clicking 'Render All' in the Wholesale/Resell views.");
  }

  setProcessing(false);

  if (fileUris.length === 0) {
    let message = "❌ No rendered images found to share.";

    if (filesNotFound.length > 0) {
      message += `\n\n🔍 DIAGNOSTIC INFO:\n`;
      message += `Products searched: ${filesNotFound.map(f => f.id).join(", ")}\n`;
      message += `Folder expected: ${targetFolder}/\n`;
      message += `Files looked for pattern: product_<ID>_${catalogueLabel}.png\n`;
      message += `\n📋 Files not found:\n`;
      filesNotFound.forEach(f => {
        message += `  - ${f.path}${f.reason ? ` (${f.reason})` : ""}\n`;
      });

      message += `\n✅ SOLUTIONS:\n`;
      message += `1. Click 'Render All' button to render images for this catalogue\n`;
      message += `2. Wait for all images to finish rendering\n`;
      message += `3. Check the browser console (F12) for errors\n`;
      message += `4. Ensure you have storage permissions granted to the app\n`;
      message += `5. Check file paths in Android's file manager:\n`;
      message += `   /storage/emulated/0/ or internal app storage`;
    } else {
      message += "\n\nMake sure you have:\n";
      message += "1. Selected at least one product\n";
      message += "2. Rendered the images using the 'Render All' button\n";
      message += `3. Images should be saved in: ${targetFolder}/ folder`;
    }

    alert(message);
    return;
  }

  try {
    console.log(`\n📤 Preparing to share:`);
    console.log(`   Files collected: ${fileUris.length}`);
    fileUris.forEach((uri, idx) => {
      console.log(`   [${idx + 1}] ${uri.substring(0, 100)}${uri.length > 100 ? '...' : ''}`);
    });

    await Share.share({
      files: fileUris,
      dialogTitle: "Share Products",
    });

    console.log("✅ Share successful!", fileUris.length, "products");
    console.log(`\n📊 Summary: Successfully shared ${fileUris.length} out of ${selected.length} selected products`);
  } catch (err) {
    console.error("❌ Share failed:", err);
    console.log(`\n📊 Share Summary: Successfully prepared ${fileUris.length} files but share was cancelled or failed`);
    alert("Sharing failed: " + (err as Error).message);
  }
}
