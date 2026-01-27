import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export async function handleShare({
  selected,
  setProcessing,
  setProcessingIndex,
  setProcessingTotal,
  mode = "resell", // or "wholesale"
}) {
  if (!selected || selected.length === 0) {
    alert("No products selected.");
    return;
  }

  setProcessing(true);
  setProcessingTotal(selected.length);

  const folder = mode === "wholesale" ? "Wholesale" : mode === "retail" ? "Retail" : "Resell";
  const fileUris = [];
  let processedCount = 0;
  let filesNotFound = [];

  console.log(`🔍 Share Debug Info:`);
  console.log(`📁 Target folder: ${folder}`);
  console.log(`🔢 Products to share: ${selected.length}`);
  console.log(`📍 Looking for files in Directory.Documents/${folder}/`);
  console.log(`Selected product IDs: ${selected.join(", ")}`);

  for (const id of selected) {
    const fileName = `product_${id}_${mode}.png`;
    const filePath = `${folder}/${fileName}`;

    try {
      // First, verify the file exists
      try {
        await Filesystem.stat({
          path: filePath,
          directory: Directory.Documents,
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
          directory: Directory.Documents,
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
            directory: Directory.Documents,
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
      filesNotFound.push({ id, path: filePath, error: err.message });
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
    let message = "No rendered images found to share.";

    if (filesNotFound.length > 0) {
      message += `\n\nProducts not found: ${filesNotFound.map(f => f.id).join(", ")}`;
      message += "\n\nHint: Make sure you have:";
      message += "\n1. Selected at least one product";
      message += "\n2. Rendered the images using the 'Render All' button";
      message += `\n3. Images should be in: ${folder}/ folder`;
    }

    alert(message);
    return;
  }

  try {
    await Share.share({
      files: fileUris,
      dialogTitle: "Share Products",
    });
    console.log("✅ Shared", fileUris.length, "products");
  } catch (err) {
    console.error("❌ Share failed:", err);
    alert("Sharing failed: " + err.message);
  }
}
