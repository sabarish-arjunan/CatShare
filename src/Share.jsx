import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { saveRenderedImage } from "./Save";

export async function handleShare({
  selected,
  setProcessing,
  setProcessingIndex,
  setProcessingTotal,
  mode = "resell", // or "wholesale" or "retail"
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

  // Get all products from localStorage for rendering
  const allProducts = JSON.parse(localStorage.getItem("products") || "[]");
  const productMap = Object.fromEntries(allProducts.map(p => [p.id, p]));

  for (const id of selected) {
    const fileName = `product_${id}_${mode}.png`;
    let imageFound = false;

    try {
      // First, try to find already-saved image
      const fileResult = await Filesystem.getUri({
        path: `${folder}/${fileName}`,
        directory: Directory.External,
      });
      fileUris.push(fileResult.uri);
      imageFound = true;
      console.log(`✅ Found existing image for product ${id}`);
    } catch (err) {
      // Image not found, render it on-the-fly
      console.log(`⏳ Image not found for product ${id}, rendering on-the-fly...`);
      
      const product = productMap[id];
      if (!product) {
        console.warn(`❌ Product ${id} not found in database, skipping...`);
        processedCount++;
        setProcessingIndex(processedCount);
        continue;
      }

      // Skip products without images
      if (!product.image && !product.imagePath) {
        console.warn(`⚠️ Product ${id} has no image, skipping...`);
        processedCount++;
        setProcessingIndex(processedCount);
        continue;
      }

      try {
        // Render the image on-the-fly
        await saveRenderedImage(product, mode, {
          resellUnit: product.resellUnit || "/ piece",
          wholesaleUnit: product.wholesaleUnit || "/ piece",
          packageUnit: product.packageUnit || "pcs / set",
          ageGroupUnit: product.ageUnit || "months",
        });

        // Now get the URI of the newly rendered image
        const fileResult = await Filesystem.getUri({
          path: `${folder}/${fileName}`,
          directory: Directory.External,
        });
        fileUris.push(fileResult.uri);
        imageFound = true;
        console.log(`✅ Rendered and added image for product ${id} to share`);
      } catch (renderErr) {
        console.error(`❌ Failed to render image for product ${id}:`, renderErr);
      }
    }

    processedCount++;
    setProcessingIndex(processedCount);
  }

  setProcessing(false);

  if (fileUris.length === 0) {
    alert("No images available to share. Please ensure products have images.");
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
