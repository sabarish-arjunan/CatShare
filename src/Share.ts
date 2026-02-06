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

  for (const id of selected) {
    // Use catalogue label (folder name) for filename pattern instead of mode
    // This matches the rendering logic: product_<id>_<catalogueLabel>.png
    const fileName = `product_${id}_${catalogueLabel}.png`;
    const filePath = `${targetFolder}/${fileName}`;

    try {
      // First, verify the file exists
      try {
        await Filesystem.stat({
          path: filePath,
          directory: Directory.External,
        });
        console.log(`✅ File exists: ${filePath}`);
      } catch (statErr) {
        console.error(`❌ File does not exist: ${filePath}`, statErr);
        filesNotFound.push({ id, path: filePath });
        processedCount++;
        setProcessingIndex(processedCount);
        continue;
      }

      // Try to get file URI for sharing
      try {
        const fileResult = await Filesystem.getUri({
          path: filePath,
          directory: Directory.External,
        });

        if (fileResult.uri) {
          fileUris.push(fileResult.uri);
          console.log(`✅ Got URI for ${fileName}:`, fileResult.uri);
        } else {
          throw new Error("No URI returned from getUri");
        }
      } catch (uriErr) {
        // Fallback: Read file as base64 and use data URL
        console.warn(`⚠️ Could not get file URI, trying base64 fallback:`, uriErr);
        try {
          const fileData = await Filesystem.readFile({
            path: filePath,
            directory: Directory.External,
          });

          // Create a data URL from the base64
          const dataUrl = `data:image/png;base64,${fileData.data}`;
          fileUris.push(dataUrl);
          console.log(`✅ Using base64 fallback for ${fileName}`);
        } catch (readErr) {
          console.error(`❌ Could not read file as fallback for ${fileName}:`, readErr);
          filesNotFound.push({ id, path: filePath, reason: "Could not get URI or read file" });
        }
      }
    } catch (err) {
      console.error(`❌ Error processing image for product ${id}:`, err);
      filesNotFound.push({ id, path: filePath, error: (err as Error).message });
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
