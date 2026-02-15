import { Filesystem, Directory } from "@capacitor/filesystem";
import { getCatalogueData } from "./config/catalogueProductUtils";
import { safeGetFromStorage } from "./utils/safeStorage";
import { renderProductToCanvas, canvasToBase64 } from "./utils/canvasRenderer";
import { renderProductToCanvasGlass } from "./utils/canvasRenderer-glass";
import { getAllCatalogues } from "./config/catalogueConfig";
import { getAllFields } from "./config/fieldConfig";
import { getCurrentCurrencySymbol } from "./utils/currencyUtils";

/**
 * Delete all rendered images for a specific product
 * across all catalogues
 */
export async function deleteRenderedImageForProduct(productId) {
  if (!productId) return;

  try {
    const catalogues = getAllCatalogues();
    for (const cat of catalogues) {
      const folder = cat.folder || cat.label;
      const filename = `product_${productId}_${folder}.png`;
      const filePath = `${folder}/${filename}`;

      try {
        await Filesystem.deleteFile({
          path: filePath,
          directory: Directory.External,
        });
        console.log(`  ✓ Deleted rendered image: ${filePath}`);
      } catch (err) {
        // Ignore errors if file doesn't exist
      }

      // Also remove from localStorage cache
      try {
        const storageKey = `rendered::${folder}::${productId}`;
        localStorage.removeItem(storageKey);
      } catch (err) {
        // Ignore errors
      }
    }
  } catch (err) {
    console.warn(`⚠️ Could not clean up rendered images for product ${productId}:`, err.message);
  }
}

/**
 * Rename rendered images when catalogue name changes
 * Moves files from old folder/name pattern to new folder/name pattern
 */
export async function renameRenderedImagesForCatalogue(oldFolder, newFolder, oldLabel, newLabel) {
  if (!oldFolder || !newFolder) return;

  try {
    console.log(`📁 Renaming rendered images from folder "${oldFolder}" (label: "${oldLabel}") to folder "${newFolder}" (label: "${newLabel}")`);

    // List all files in the old folder
    let oldFiles = [];
    try {
      const result = await Filesystem.readdir({
        path: oldFolder,
        directory: Directory.External,
      });
      oldFiles = result.files || [];
    } catch (err) {
      // Old folder might not exist (no images rendered yet)
      if (err.code !== 'NotFound') {
        console.warn(`⚠️  Could not read old folder ${oldFolder}:`, err.message);
      }
      return;
    }

    if (oldFiles.length === 0) {
      console.log(`✅ No files found in old folder: ${oldFolder}`);
      return;
    }

    // Process each file
    for (const file of oldFiles) {
      try {
        const oldPath = `${oldFolder}/${file.name}`;

        // Extract product ID from filename pattern: product_<id>_<label>.png
        const fileMatch = file.name.match(/^product_([^_]+)_.*\.png$/);
        if (!fileMatch) {
          console.warn(`  ⚠️  Skipping file with unexpected format: ${file.name}`);
          continue;
        }

        const productId = fileMatch[1];
        const newFileName = `product_${productId}_${newLabel}.png`;
        const newPath = `${newFolder}/${newFileName}`;

        // Read the file from old location
        const fileData = await Filesystem.readFile({
          path: oldPath,
          directory: Directory.External,
        });

        // Write to new location with new filename
        await Filesystem.writeFile({
          path: newPath,
          data: fileData.data,
          directory: Directory.External,
          recursive: true,
        });

        console.log(`  ✓ Renamed: ${file.name} → ${newFileName}`);

        // Delete the old file
        try {
          await Filesystem.deleteFile({
            path: oldPath,
            directory: Directory.External,
          });
          console.log(`    ✓ Cleaned up old file: ${file.name}`);
        } catch (delErr) {
          console.warn(`    ⚠️  Could not delete old file ${file.name}:`, delErr.message);
        }
      } catch (err) {
        console.warn(`  ⚠️  Could not process file ${file.name}:`, err.message);
      }
    }

    // Delete the now-empty old folder
    try {
      await Filesystem.rmdir({
        path: oldFolder,
        directory: Directory.External,
        recursive: false, // Only delete if folder is empty
      });
      console.log(`✅ Deleted empty old folder: ${oldFolder}`);
    } catch (rmErr) {
      // Folder might not be empty or other issues, but this is not critical
      console.warn(`⚠️  Could not delete old folder ${oldFolder}:`, rmErr.message);
    }

    console.log(`✅ Renaming completed for catalogue images`);
  } catch (err) {
    console.warn(`⚠️  Could not rename catalogue images:`, err.message);
  }
}

/**
 * Delete all rendered images from a folder
 * Used when catalogue is deleted
 */
export async function deleteRenderedImagesFromFolder(folderName) {
  if (!folderName) return;

  try {
    console.log(`🗑️  Cleaning up rendered images from folder: ${folderName}`);

    // List all files in the folder
    const result = await Filesystem.readdir({
      path: folderName,
      directory: Directory.External,
    });

    if (!result.files || result.files.length === 0) {
      console.log(`✅ Folder is empty or doesn't exist: ${folderName}`);
      return;
    }

    // Delete each file
    for (const file of result.files) {
      try {
        await Filesystem.deleteFile({
          path: `${folderName}/${file.name}`,
          directory: Directory.External,
        });
        console.log(`  ✓ Deleted: ${file.name}`);
      } catch (err) {
        console.warn(`  ⚠️  Could not delete ${file.name}:`, err.message);
      }
    }

    console.log(`✅ Cleanup completed for folder: ${folderName}`);
  } catch (err) {
    // Folder might not exist yet, which is fine
    if (err.code !== 'NotFound') {
      console.warn(`⚠️  Could not clean up folder ${folderName}:`, err.message);
    }
  }
}

export async function saveRenderedImage(product, type, units = {}) {
  const id = product.id || "temp-id";
  const fontColor = product.fontColor || "white";
  const bgColor = product.bgColor || "#add8e6";
  const imageBg = product.imageBgColor || "white";
  const badgeBg = imageBg.toLowerCase() === "white" ? "#fff" : "#000";
  const badgeText = imageBg.toLowerCase() === "white" ? "#000" : "#fff";
  const badgeBorder =
    imageBg.toLowerCase() === "white"
      ? "rgba(0, 0, 0, 0.4)"
      : "rgba(255, 255, 255, 0.4)";

  const getLighterColor = (color) => {
    if (color.startsWith("#") && color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const lighten = (c) => Math.min(255, c + 40);
      return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
    }
    const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      const lighten = (c) => Math.min(255, c + 40);
      return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
    }
    return color;
  };

  // ✅ Load image from Filesystem if not present
  console.log(`🖼️ Product image status:`, {
    hasImage: !!product.image,
    hasImagePath: !!product.imagePath,
    imagePath: product.imagePath,
    imageLength: product.image?.length,
  });

  if (!product.image && product.imagePath) {
    try {
      console.log(`📂 Loading image from filesystem: ${product.imagePath}`);
      const res = await Filesystem.readFile({
        path: product.imagePath,
        directory: Directory.Data,
      });
      product.image = `data:image/png;base64,${res.data}`;
      console.log(`✅ Image loaded from filesystem. Base64 length: ${product.image.length}`);
    } catch (err) {
      console.error("❌ Failed to load image for rendering:", err.message);
      return;
    }
  }

  // ✅ Ensure product.image exists before rendering
  if (!product.image) {
    console.error("❌ Failed to load image for rendering: File does not exist.");
    console.error("Product object:", {
      id: product.id,
      name: product.name,
      imagePath: product.imagePath,
      hasImage: !!product.image,
    });
    return;
  }

  // Calculate dimensions based on crop aspect ratio
  const cropAspectRatio = product.cropAspectRatio || 1;
  const baseWidth = 330;
  const baseHeight = baseWidth / cropAspectRatio;

  // Get catalogue-specific data if catalogueId is provided
  let catalogueData = product;
  if (units.catalogueId) {
    const catData = getCatalogueData(product, units.catalogueId);
    catalogueData = { ...product, ...catData };
  }

  // Support both legacy and dynamic catalogue parameters
  const priceField = units.priceField || (type === "wholesale" ? "price1" : type);
  const priceUnitField = units.priceUnitField || (type === "wholesale" ? "price1Unit" : `${type}Unit`);

  // Get price from catalogueData using dynamic field
  const price = catalogueData[priceField] !== undefined ? catalogueData[priceField] : catalogueData[priceField.replace(/\d/g, '')] || 0;
  const priceUnit = units[priceUnitField] || catalogueData[priceUnitField] || (units.price1Unit || units.wholesaleUnit);

  try {
    // Prepare product data for Canvas rendering
    const renderScale = 3;

    console.log(`🎨 Starting Canvas render for product: ${product.name || product.id}`);
    console.log(`🖼️ Image source: ${catalogueData.image || product.image}`);

    const productData = {
      name: catalogueData.name,
      subtitle: catalogueData.subtitle,
      image: catalogueData.image || product.image,
      price: price !== "" && price !== 0 ? price : undefined,
      priceUnit: price ? priceUnit : undefined,
      badge: catalogueData.badge,
      cropAspectRatio: cropAspectRatio,
    };

    // Add all enabled fields dynamically
    getAllFields()
      .filter(f => f.enabled && f.key.startsWith('field'))
      .forEach(field => {
        productData[field.key] = catalogueData[field.key] || "";
        const unitKey = `${field.key}Unit`;
        productData[unitKey] = catalogueData[unitKey] || "None";
      });

    // Get watermark settings with proper fallbacks
    let isWatermarkEnabled = safeGetFromStorage("showWatermark", false);
    let watermarkText = safeGetFromStorage("watermarkText", "Created using CatShare");
    let watermarkPosition = safeGetFromStorage("watermarkPosition", "bottom-center");

    // Additional safety check - ensure watermarkPosition is a string, not JSON
    if (typeof watermarkPosition !== 'string' || !watermarkPosition) {
      watermarkPosition = "bottom-center";
    }

    console.log(`✅ Watermark Settings:`, {
      enabled: isWatermarkEnabled,
      text: watermarkText,
      position: watermarkPosition,
      productName: product.name
    });

    // Render using Canvas API - Choose renderer based on theme
    let canvas;
    try {
      const isGlassTheme = product.renderingType === "glass";
      console.log(`🎨 Using ${isGlassTheme ? "Glass" : "Classic"} theme renderer for: ${product.name}`);

      const renderOptions = {
        width: baseWidth,
        scale: renderScale,
        bgColor: bgColor,
        imageBgColor: imageBg,
        fontColor: fontColor,
        backgroundColor: "#ffffff",
        currencySymbol: getCurrentCurrencySymbol(),
      };

      const watermarkOptions = {
        enabled: isWatermarkEnabled,
        text: watermarkText,
        position: watermarkPosition,
      };

      if (isGlassTheme) {
        canvas = await renderProductToCanvasGlass(productData, renderOptions, watermarkOptions);
      } else {
        canvas = await renderProductToCanvas(productData, renderOptions, watermarkOptions);
      }
      console.log(`✅ Canvas rendered successfully. Size: ${canvas.width}x${canvas.height}`);
    } catch (renderErr) {
      console.error(`❌ Canvas rendering failed:`, renderErr);
      throw renderErr;
    }

    let base64;
    try {
      base64 = canvasToBase64(canvas);
      console.log(`✅ Canvas converted to base64. Length: ${base64.length} chars`);
      if (!base64 || base64.length === 0) {
        throw new Error("Base64 conversion resulted in empty string");
      }
    } catch (b64Err) {
      console.error(`❌ Base64 conversion failed:`, b64Err);
      throw b64Err;
    }

    // Use folder name (which is set to catalogue name) for organizing rendered images
    let folder;
    let catalogueLabel;
    if (units.folder) {
      // Folder name passed directly (set to catalogue name/label)
      folder = units.folder;
      catalogueLabel = units.folder;
    } else if (units.catalogueLabel) {
      // Use catalogue label/name as folder name
      folder = units.catalogueLabel;
      catalogueLabel = units.catalogueLabel;
    } else if (units.catalogueId) {
      // Fallback: use catalogue ID if label not provided
      folder = units.catalogueId;
      catalogueLabel = units.catalogueId;
    } else {
      // Final fallback: use the type parameter as folder name
      // This ensures the correct folder is used even for old products
      folder = type;
      catalogueLabel = type;
    }

    // Filename includes catalogue label for proper identification and organization
    const filename = `product_${id}_${catalogueLabel}.png`;

    const filePath = `${folder}/${filename}`;

    try {
      console.log(`📝 Writing file to: ${filePath}`);
      console.log(`📁 Using directory: Directory.External (App-specific external storage)`);
      console.log(`📍 Android path: /storage/emulated/0/Android/data/com.catshare.official/files/${filePath}`);
      console.log(`📊 Base64 data details:`, {
        length: base64?.length || 0,
        isString: typeof base64 === 'string',
        first20chars: base64?.substring(0, 20) || 'N/A',
        isEmpty: !base64 || base64.length === 0,
      });

      if (!base64 || base64.length === 0) {
        throw new Error("Base64 data is empty - canvas may not have rendered correctly");
      }

      console.log(`📤 Starting writeFile operation...`);
      await Filesystem.writeFile({
        path: filePath,
        data: base64,
        directory: Directory.External,
        recursive: true,
      });

      console.log("✅ Image saved successfully:", filePath);
      console.log(`📝 Written base64 data length: ${base64.length} characters`);

      // Try to store rendered image in localStorage for quick access during sharing
      // This is optional and won't block if quota is exceeded
      try {
        const storageKey = `rendered::${catalogueLabel}::${id}`;
        const dataToStore = JSON.stringify({
          base64,
          timestamp: Date.now(),
          filename,
          catalogueLabel,
        });

        // Check estimated size before storing (rough estimate: each character ~1 byte)
        const estimatedSizeKB = (dataToStore.length / 1024).toFixed(2);

        if (dataToStore.length > 2 * 1024 * 1024) {
          // Skip if larger than 2MB to preserve localStorage quota
          console.warn(`⚠️ Image too large for localStorage cache (${estimatedSizeKB}KB) - skipping cache. File saved to disk.`);
        } else {
          localStorage.setItem(storageKey, dataToStore);
          console.log(`💾 Stored rendered image in localStorage: ${storageKey} (${estimatedSizeKB}KB)`);
        }
      } catch (cacheErr) {
        // localStorage quota exceeded - this is not critical
        // The image is already saved to disk, which is what matters
        if (cacheErr.name === 'QuotaExceededError') {
          console.warn(`⚠️ localStorage quota exceeded - skipping cache. Image saved to disk successfully.`);
          console.warn(`💡 To free up space: Clear app cache or export products and delete old catalogs`);
        } else {
          console.warn(`⚠️ Could not cache image in localStorage:`, cacheErr.message);
        }
        // Don't rethrow - the image is safely saved to disk
      }

      // Verify the file was actually written
      try {
        console.log(`🔍 Verifying file at: ${filePath}`);
        const stat = await Filesystem.stat({
          path: filePath,
          directory: Directory.External,
        });
        console.log(`✅ File verified - exists at: ${filePath}`, stat);

        // Try to get the file URI to see the actual path
        try {
          const uriResult = await Filesystem.getUri({
            path: filePath,
            directory: Directory.External,
          });
          console.log(`📍 File URI: ${uriResult.uri}`);
        } catch (uriErr) {
          console.log(`⚠️ Could not get file URI: ${uriErr.message}`);
        }
      } catch (verifyErr) {
        console.error(`❌ CRITICAL: File write succeeded but file not found during verification: ${filePath}`, verifyErr);
        console.error(`This suggests the file was saved to a different location than expected`);
        throw new Error(`File verification failed - files may not be saved to correct location: ${verifyErr.message}`);
      }
    } catch (writeErr) {
      console.error(`❌ Failed to write file: ${filePath}`, writeErr);
      console.error(`📋 Error details:`, {
        message: writeErr.message,
        code: writeErr.code,
        folder,
        filename,
        directorySetting: "Directory.External",
        androidPath: `/storage/emulated/0/Android/data/com.catshare.official/files/${filePath}`
      });
      throw writeErr;
    }
  } catch (err) {
    console.error("❌ saveRenderedImage failed:", err.message || err);
    throw err; // Rethrow so caller knows rendering failed
  }
}
