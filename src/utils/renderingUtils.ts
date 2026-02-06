import { Filesystem, Directory } from "@capacitor/filesystem";
import { renderProductToCanvas, canvasToBase64 } from "./canvasRenderer";
import { getCatalogueData } from "../config/catalogueProductUtils";
import { safeGetFromStorage } from "./safeStorage";

/**
 * Retrieve a rendered image from localStorage or filesystem
 * Returns the base64 data URL for the image
 */
export async function getRenderedImage(
  productId: string,
  catalogueLabel: string
): Promise<string | null> {
  // First try localStorage
  const storageKey = `rendered::${catalogueLabel}::${productId}`;
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.base64) {
        console.log(`✅ Retrieved rendered image from localStorage: ${storageKey}`);
        return `data:image/png;base64,${data.base64}`;
      }
    }
  } catch (err) {
    console.warn(`⚠️ Could not parse stored image data for ${storageKey}:`, err);
  }

  // Try filesystem as fallback
  const filename = `product_${productId}_${catalogueLabel}.png`;
  const filePath = `${catalogueLabel}/${filename}`;

  try {
    const fileData = await Filesystem.readFile({
      path: filePath,
      directory: Directory.External,
    });
    console.log(`✅ Retrieved rendered image from filesystem: ${filePath}`);
    return `data:image/png;base64,${fileData.data}`;
  } catch (err) {
    console.log(`⚠️ Rendered image not found in filesystem: ${filePath}`);
    return null;
  }
}

/**
 * Render a product image on-the-fly and return as base64 data URL
 */
export async function renderProductImageOnTheFly(
  product: any,
  catalogueLabel: string,
  catalogueId?: string
): Promise<string | null> {
  try {
    if (!product.image && product.imagePath) {
      try {
        console.log(`📂 Loading image from filesystem: ${product.imagePath}`);
        const res = await Filesystem.readFile({
          path: product.imagePath,
          directory: Directory.Data,
        });
        product.image = `data:image/png;base64,${res.data}`;
      } catch (err) {
        console.error("❌ Failed to load image for on-the-fly rendering:", err.message);
        return null;
      }
    }

    if (!product.image) {
      console.warn(`❌ No image available for product ${product.id} to render`);
      return null;
    }

    // Get catalogue-specific data if catalogueId is provided
    let catalogueData = product;
    if (catalogueId) {
      const catData = getCatalogueData(product, catalogueId);
      catalogueData = {
        ...product,
        field1: catData.field1 !== undefined && catData.field1 !== null ? catData.field1 : (product.color || ""),
        field2: catData.field2 !== undefined && catData.field2 !== null ? catData.field2 : (product.package || ""),
        field2Unit: catData.field2Unit !== undefined && catData.field2Unit !== null ? catData.field2Unit : (product.packageUnit || "pcs / set"),
        field3: catData.field3 !== undefined && catData.field3 !== null ? catData.field3 : (product.age || ""),
        field3Unit: catData.field3Unit !== undefined && catData.field3Unit !== null ? catData.field3Unit : (product.ageUnit || "months"),
        price1: catData.price1 !== undefined && catData.price1 !== null ? catData.price1 : (product.wholesale || ""),
        price1Unit: catData.price1Unit !== undefined && catData.price1Unit !== null ? catData.price1Unit : (product.wholesaleUnit || "/ piece"),
        price2: catData.price2 !== undefined && catData.price2 !== null ? catData.price2 : (product.resell || ""),
        price2Unit: catData.price2Unit !== undefined && catData.price2Unit !== null ? catData.price2Unit : (product.resellUnit || "/ piece"),
      };
    }

    const cropAspectRatio = product.cropAspectRatio || 1;
    const baseWidth = 330;

    // Get styling settings
    const fontColor = product.fontColor || "white";
    const bgColor = product.bgColor || "#add8e6";
    const imageBg = product.imageBgColor || "white";

    // Get price field
    const priceField = catalogueId === "cat2" ? "price2" : catalogueId === "cat1" ? "price1" : "price1";
    const priceUnitField = catalogueId === "cat2" ? "price2Unit" : catalogueId === "cat1" ? "price1Unit" : "price1Unit";
    const price = catalogueData[priceField] || 0;
    const priceUnit = catalogueData[priceUnitField] || "/ piece";

    // Get watermark settings
    const isWatermarkEnabled = safeGetFromStorage("showWatermark", false);
    const watermarkText = safeGetFromStorage("watermarkText", "Created using CatShare");
    // Get watermark position as plain string (not JSON)
    const watermarkPosition = localStorage.getItem("watermarkPosition") || "bottom-center";

    const productData = {
      name: catalogueData.name,
      subtitle: catalogueData.subtitle,
      image: catalogueData.image || product.image,
      field1: catalogueData.field1,
      field2: catalogueData.field2,
      field2Unit: catalogueData.field2Unit,
      field3: catalogueData.field3,
      field3Unit: catalogueData.field3Unit,
      price: price !== "" && price !== 0 ? price : undefined,
      priceUnit: price ? priceUnit : undefined,
      badge: catalogueData.badge,
      cropAspectRatio: cropAspectRatio,
    };

    console.log(`🎨 On-the-fly rendering product: ${product.name || product.id}`);

    const canvas = await renderProductToCanvas(
      productData,
      {
        width: baseWidth,
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

    const base64 = canvasToBase64(canvas);
    console.log(`✅ Product rendered on-the-fly successfully`);
    return `data:image/png;base64,${base64}`;
  } catch (err) {
    console.error(`❌ Failed to render product on-the-fly:`, err);
    return null;
  }
}
