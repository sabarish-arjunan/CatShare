import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export async function handleShare({
  selected,
  setProcessing,
  setProcessingIndex,
  setProcessingTotal,
  mode = "resell", // or "wholesale"
  showPopup, // New parameter for error notification
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

  for (const id of selected) {
    const fileName = `product_${id}_${mode}.png`;

    try {
      const fileResult = await Filesystem.getUri({
        path: `${folder}/${fileName}`,
        directory: Directory.External,
      });

      fileUris.push(fileResult.uri);
    } catch (err) {
      console.warn(`❌ Could not find saved image for product ${id}:`, err);
    }

    processedCount++;
    setProcessingIndex(processedCount);
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
