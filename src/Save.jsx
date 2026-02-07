import { Filesystem, Directory } from "@capacitor/filesystem";
import { getCatalogueData } from "./config/catalogueProductUtils";
import { renderProductToCanvas, canvasToBase64 } from "./utils/canvasRenderer";

export async function saveRenderedImage(product, type, units = {}) {
  const id = product.id || "temp-id";
  const fontColor = product.fontColor || "white";
  const bgColor = product.bgColor || "#add8e6";
  const imageBg = product.imageBgColor || "white";

  // ✅ Load image from Filesystem if not present
  if (!product.image && product.imagePath) {
    try {
      const res = await Filesystem.readFile({
        path: product.imagePath,
        directory: Directory.Data,
      });
      product.image = `data:image/png;base64,${res.data}`;
    } catch (err) {
      console.error("❌ Failed to load image for rendering:", err.message);
      return;
    }
  }

  // ✅ Ensure product.image exists before rendering
  if (!product.image) {
    console.error("❌ Failed to load image for rendering: File does not exist.");
    return;
  }

  // Get catalogue-specific data if catalogueId is provided
  let catalogueData = product;
  if (units.catalogueId) {
    const catData = getCatalogueData(product, units.catalogueId);
    catalogueData = {
      ...product,
      field1: catData.field1 || product.field1 || product.color || "",
      field2: catData.field2 || product.field2 || product.package || "",
      field2Unit: catData.field2Unit || product.field2Unit || product.packageUnit || "pcs / set",
      field3: catData.field3 || product.field3 || product.age || "",
      field3Unit: catData.field3Unit || product.field3Unit || product.ageUnit || "months",
      // Include all catalogue price fields
      price1: catData.price1 || product.price1 || product.wholesale || "",
      price1Unit: catData.price1Unit || product.price1Unit || product.wholesaleUnit || "/ piece",
      price2: catData.price2 || product.price2 || product.resell || "",
      price2Unit: catData.price2Unit || product.price2Unit || product.resellUnit || "/ piece",
    };
  }

  // Support both legacy and dynamic catalogue parameters
  const priceField = units.priceField || (type === "resell" ? "price2" : type === "wholesale" ? "price1" : type);
  const priceUnitField = units.priceUnitField || (type === "resell" ? "price2Unit" : type === "wholesale" ? "price1Unit" : `${type}Unit`);

  // Get price from catalogueData using dynamic field
  const price = catalogueData[priceField] !== undefined ? catalogueData[priceField] : catalogueData[priceField.replace(/\d/g, '')] || 0;
  const priceUnit = units[priceUnitField] || catalogueData[priceUnitField] || (type === "resell" ? (units.price2Unit || units.resellUnit) : (units.price1Unit || units.wholesaleUnit));

  try {
    // Get watermark settings
    const showWatermark = localStorage.getItem("showWatermark");
    const isWatermarkEnabled = showWatermark !== null ? JSON.parse(showWatermark) : false;
    const watermarkText = localStorage.getItem("watermarkText") || "Created using CatShare";
    const watermarkPosition = localStorage.getItem("watermarkPosition") || "bottom-center";

    // Prepare product data for canvas rendering
    const productData = {
      name: catalogueData.name || product.name || "Product",
      subtitle: catalogueData.subtitle || product.subtitle || "",
      image: catalogueData.image || product.image,
      field1: catalogueData.field1 || "",
      field2: catalogueData.field2 || "",
      field2Unit: catalogueData.field2Unit || "pcs / set",
      field3: catalogueData.field3 || "",
      field3Unit: catalogueData.field3Unit || "months",
      price: price !== "" && price !== 0 ? price : undefined,
      priceUnit: price ? priceUnit : "/ piece",
      badge: catalogueData.badge || product.badge || "",
      cropAspectRatio: catalogueData.cropAspectRatio || product.cropAspectRatio || 1,
    };

    // Render using Canvas API
    const canvas = await renderProductToCanvas(
      productData,
      {
        width: 330,
        scale: 3,
        bgColor: bgColor,
        imageBgColor: imageBg,
        fontColor: fontColor,
        backgroundColor: "#ffffff",
      },
      {
        enabled: isWatermarkEnabled,
        text: watermarkText,
        position: watermarkPosition,
      }
    );

    // Convert canvas to base64
    const base64 = canvasToBase64(canvas);
    const filename = `product_${id}_${type}.png`;

    // Use catalogueId if provided, otherwise fall back to legacy type mapping
    let folder;
    if (units.catalogueId) {
      folder = units.catalogueId;
    } else {
      folder = type === "wholesale" ? "Wholesale" : type === "resell" ? "Resell" : type;
    }

    // Save to filesystem
    await Filesystem.writeFile({
      path: `${folder}/${filename}`,
      data: base64,
      directory: Directory.External,
      recursive: true,
    });

    console.log("✅ Image saved using Canvas API:", `${folder}/${filename}`);
  } catch (err) {
    console.error("❌ saveRenderedImage failed:", err.message || err);
  }
}
