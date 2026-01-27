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

  for (const id of selected) {
    const fileName = `product_${id}_${mode}.png`;
    const filePath = `${folder}/${fileName}`;

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

      // If file exists, get its URI
      const fileResult = await Filesystem.getUri({
        path: filePath,
        directory: Directory.External,
      });

      if (fileResult.uri) {
        fileUris.push(fileResult.uri);
        console.log(`✅ Got URI for ${fileName}:`, fileResult.uri);
      } else {
        console.warn(`❌ Could not get URI for ${fileName}`);
        filesNotFound.push({ id, path: filePath, reason: "No URI returned" });
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
    alert("No images found to share.");
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
