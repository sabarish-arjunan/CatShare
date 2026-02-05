import { Filesystem, Directory } from "@capacitor/filesystem";
import { getCatalogueData } from "./config/catalogueProductUtils";
import { safeGetFromStorage } from "./utils/safeStorage";
import { renderProductToCanvas, canvasToBase64 } from "./utils/canvasRenderer";

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

  // Calculate dimensions based on crop aspect ratio
  const cropAspectRatio = product.cropAspectRatio || 1;
  const baseWidth = 330;
  const baseHeight = baseWidth / cropAspectRatio;

  const wrapper = document.createElement("div");
  Object.assign(wrapper.style, {
    position: "absolute",
    top: "0",
    left: "0",
    width: `${baseWidth}px`,
    height: "auto",
    backgroundColor: "transparent",
    opacity: "0",
    pointerEvents: "none",
    overflow: "hidden",
    padding: "0",
    boxSizing: "border-box",
  });

  const container = document.createElement("div");
  container.className = `full-detail-${id}-${type}`;
  container.style.backgroundColor = getLighterColor(bgColor);
  container.style.overflow = "visible";
  container.style.display = "flex";
  container.style.flexDirection = "column";

  // Get catalogue-specific data if catalogueId is provided
  let catalogueData = product;
  if (units.catalogueId) {
    const catData = getCatalogueData(product, units.catalogueId);
    catalogueData = {
      ...product,
      // Use only catalogue-specific data, fall back only to legacy field names (not other catalogues)
      // Check explicitly for undefined/null, not just falsy (to preserve empty strings as intentional)
      field1: catData.field1 !== undefined && catData.field1 !== null ? catData.field1 : (product.color || ""),
      field2: catData.field2 !== undefined && catData.field2 !== null ? catData.field2 : (product.package || ""),
      field2Unit: catData.field2Unit !== undefined && catData.field2Unit !== null ? catData.field2Unit : (product.packageUnit || "pcs / set"),
      field3: catData.field3 !== undefined && catData.field3 !== null ? catData.field3 : (product.age || ""),
      field3Unit: catData.field3Unit !== undefined && catData.field3Unit !== null ? catData.field3Unit : (product.ageUnit || "months"),
      // Include all catalogue price fields - fall back to legacy names only
      price1: catData.price1 !== undefined && catData.price1 !== null ? catData.price1 : (product.wholesale || ""),
      price1Unit: catData.price1Unit !== undefined && catData.price1Unit !== null ? catData.price1Unit : (product.wholesaleUnit || "/ piece"),
      price2: catData.price2 !== undefined && catData.price2 !== null ? catData.price2 : (product.resell || ""),
      price2Unit: catData.price2Unit !== undefined && catData.price2Unit !== null ? catData.price2Unit : (product.resellUnit || "/ piece"),
    };
  }

  // Support both legacy and dynamic catalogue parameters
  const priceField = units.priceField || (type === "resell" ? "price2" : type === "wholesale" ? "price1" : type);
  const priceUnitField = units.priceUnitField || (type === "resell" ? "price2Unit" : type === "wholesale" ? "price1Unit" : `${type}Unit`);

  // Get price from catalogueData using dynamic field
  const price = catalogueData[priceField] !== undefined ? catalogueData[priceField] : catalogueData[priceField.replace(/\d/g, '')] || 0;
  const priceUnit = units[priceUnitField] || catalogueData[priceUnitField] || (type === "resell" ? (units.price2Unit || units.resellUnit) : (units.price1Unit || units.wholesaleUnit));

  // Only create and append price bar if product has a price for this catalogue
  const hasPriceValue = price !== undefined && price !== null && price !== "" && price !== 0;

  // Helper function to check if a field has a valid value
  const hasFieldValue = (value) => value !== undefined && value !== null && value !== "";

  // Check each field for values
  const hasField1 = hasFieldValue(catalogueData.field1);
  const hasField2 = hasFieldValue(catalogueData.field2);
  const hasField3 = hasFieldValue(catalogueData.field3);

  let priceBar = null;
  if (hasPriceValue) {
    priceBar = document.createElement("h2");
    Object.assign(priceBar.style, {
      backgroundColor: bgColor,
      color: fontColor,
      padding: "8px",
      textAlign: "center",
      fontWeight: "normal",
      fontSize: "19px",
      margin: 0,
      lineHeight: 1.2,
      width: "100%",
      boxSizing: "border-box",
      flexShrink: 0,
    });
    priceBar.innerText = `Price   :   ₹${price} ${priceUnit}`;
  }

  // Price bar at bottom for all catalogues
  const isPriceOnTop = false;

  if (isPriceOnTop && priceBar) {
    container.appendChild(priceBar); // Price on top
  }

  const imageShadowWrap = document.createElement("div");
  Object.assign(imageShadowWrap.style, {
    boxShadow: "0 12px 15px -6px rgba(0, 0, 0, 0.4)",
    marginBottom: "1px",
    borderRadius: "0",
    width: "100%",
    flexShrink: 0,
  });
  imageShadowWrap.id = `image-shadow-wrap-${id}`;

  const imageWrap = document.createElement("div");
  Object.assign(imageWrap.style, {
    backgroundColor: imageBg,
    textAlign: "center",
    padding: "0",
    position: "relative",
    overflow: "visible",
    width: "100%",
    aspectRatio: `${cropAspectRatio}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });
  imageWrap.id = `image-wrap-${id}`;

  const img = document.createElement("img");
  img.alt = catalogueData.name;
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "contain";
  img.style.margin = "0 auto";
  imageWrap.appendChild(img);
  img.src = catalogueData.image || product.image;

  await new Promise((resolve) => {
    img.onload = resolve;
    img.onerror = resolve;
  });

  if (catalogueData.badge) {
    const badge = document.createElement("div");
    Object.assign(badge.style, {
      position: "absolute",
      bottom: "12px",
      right: "12px",
      backgroundColor: badgeBg,
      color: badgeText,
      fontSize: "13px",
      fontWeight: 600,
      padding: "6px 10px",
      borderRadius: "999px",
      opacity: 0.95,
      boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      border: `1px solid ${badgeBorder}`,
      letterSpacing: "0.5px",
    });
    badge.innerText = catalogueData.badge.toUpperCase();
    imageWrap.appendChild(badge);
  }

  imageShadowWrap.appendChild(imageWrap);
  container.appendChild(imageShadowWrap);

  const details = document.createElement("div");
  details.style.backgroundColor = getLighterColor(bgColor);
  details.style.color = fontColor;
  details.style.padding = "10px";
  details.style.fontSize = "17px";
  details.style.width = "100%";
  details.style.boxSizing = "border-box";
  details.style.flexShrink = 0;

  // Build field rows using DOM to prevent XSS
  const fieldRowsContainer = document.createElement("div");
  fieldRowsContainer.style.textAlign = "left";
  fieldRowsContainer.style.lineHeight = "1.4";

  if (hasField1) {
    const p = document.createElement("p");
    p.style.margin = "2px 0";
    p.style.display = "flex";
    p.innerHTML = '<span style="width:110px">Colour</span><span>:</span><span style="margin-left:8px"></span>';
    p.querySelector('span:last-child').textContent = catalogueData.field1;
    fieldRowsContainer.appendChild(p);
  }
  if (hasField2) {
    const p = document.createElement("p");
    p.style.margin = "2px 0";
    p.style.display = "flex";
    p.innerHTML = '<span style="width:110px">Package</span><span>:</span><span style="margin-left:8px"></span>';
    p.querySelector('span:last-child').textContent = `${catalogueData.field2} ${catalogueData.field2Unit}`;
    fieldRowsContainer.appendChild(p);
  }
  if (hasField3) {
    const p = document.createElement("p");
    p.style.margin = "2px 0";
    p.style.display = "flex";
    p.innerHTML = '<span style="width:110px">Age Group</span><span>:</span><span style="margin-left:8px"></span>';
    p.querySelector('span:last-child').textContent = `${catalogueData.field3} ${catalogueData.field3Unit}`;
    fieldRowsContainer.appendChild(p);
  }

  // Build title section
  const titleDiv = document.createElement("div");
  titleDiv.style.textAlign = "center";
  titleDiv.style.marginBottom = "6px";

  const nameP = document.createElement("p");
  nameP.style.fontWeight = "normal";
  nameP.style.textShadow = "3px 3px 5px rgba(0,0,0,0.2)";
  nameP.style.fontSize = "28px";
  nameP.style.margin = "3px";
  nameP.textContent = catalogueData.name;
  titleDiv.appendChild(nameP);

  if (catalogueData.subtitle) {
    const subtitleP = document.createElement("p");
    subtitleP.style.fontStyle = "italic";
    subtitleP.style.fontSize = "18px";
    subtitleP.style.margin = "5px";
    subtitleP.textContent = `(${catalogueData.subtitle})`;
    titleDiv.appendChild(subtitleP);
  }

  details.appendChild(titleDiv);
  details.appendChild(fieldRowsContainer);
  container.appendChild(details);

  if (!isPriceOnTop && priceBar) {
    container.appendChild(priceBar); // Price at bottom
  }

  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  await new Promise((r) => setTimeout(r, 30));
  wrapper.style.opacity = "1";

  try {
    // Keep scale at 3 for high quality output
    const renderScale = 3;

    // Render at high quality with optimizations
    const canvas = await html2canvas(wrapper, {
      scale: renderScale,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
      allowTaint: false,
      // Additional optimizations for faster rendering
      imageTimeout: 5000,
      removeContainer: true,
    });

    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = canvas.width;
    croppedCanvas.height = canvas.height - 3;

    const ctx = croppedCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context from canvas - rendering cannot continue");
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0);

    // Release canvas memory immediately to prevent buildup
    canvas.width = 0;
    canvas.height = 0;

    // Add watermark - Only if enabled in settings
    const isWatermarkEnabled = safeGetFromStorage("showWatermark", false);

    if (isWatermarkEnabled) {
      // Get custom watermark text from localStorage, default to "Created using CatShare"
      const watermarkText = safeGetFromStorage("watermarkText", "Created using CatShare");
      const watermarkPosition = safeGetFromStorage("watermarkPosition", "bottom-center");

      // Get the imageWrap and imageShadowWrap elements to determine position in the rendered canvas
      const imageWrapEl = document.getElementById(`image-wrap-${id}`);
      const imageShadowWrapEl = document.getElementById(`image-shadow-wrap-${id}`);
      const containerEl = imageWrapEl?.closest(`.full-detail-${id}-${type}`);

      if (imageWrapEl && imageShadowWrapEl && containerEl) {
        // html2canvas renders at 3x scale
        const scale = 3;
        const containerWidth = baseWidth; // wrapper width in px
        const scaledContainerWidth = containerWidth * scale;

        // Get the computed dimensions of the image wrap
        const imageWrapStyle = window.getComputedStyle(imageWrapEl);
        const imageShadowWrapStyle = window.getComputedStyle(imageShadowWrapEl);
        const imagePadding = 16; // padding in imageWrap

        // Calculate dimensions accounting for all parent elements
        const imageWrapWidth = containerWidth * renderScale; // Full container width

        // Calculate offset from top
        // For wholesale: priceBar (≈36px) + imageShadowWrap offset
        // For resell: imageShadowWrap offset + other content
        let imageWrapOffsetTop = 0;
        let currentEl = imageShadowWrapEl;

        // Sum up the heights of all previous siblings
        while (currentEl.previousElementSibling) {
          const prevEl = currentEl.previousElementSibling;
          const prevHeight = prevEl.offsetHeight || 0;
          imageWrapOffsetTop += prevHeight;
          currentEl = prevEl;
        }

        imageWrapOffsetTop *= renderScale;

        // Image section height includes padding and the image itself
        const imageWrapHeight = imageWrapEl.offsetHeight * renderScale;
        const imageWrapOffsetLeft = 0;

        // Watermark font size should be relative to image section width
        // Matches the preview sizing logic
        const previewFontSize = 10; // Base font size in preview
        const watermarkSize = previewFontSize * renderScale; // Scale up proportionally
        ctx.font = `${Math.floor(watermarkSize)}px Arial, sans-serif`;

        // Check if background is light or dark and set watermark color accordingly
        const isLightBg = imageBg.toLowerCase() === "white" || imageBg.toLowerCase() === "#ffffff";
        ctx.fillStyle = isLightBg ? "rgba(0, 0, 0, 0.25)" : "rgba(255, 255, 255, 0.4)";

        // Calculate position based on watermarkPosition, relative to image section only
        const padding = 10 * renderScale; // Scale padding to match canvas scale (50% towards corner)
        let watermarkX, watermarkY;

        switch(watermarkPosition) {
          case "top-left":
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            watermarkX = imageWrapOffsetLeft + padding;
            watermarkY = imageWrapOffsetTop + padding;
            break;
          case "top-center":
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            watermarkX = imageWrapOffsetLeft + imageWrapWidth / 2;
            watermarkY = imageWrapOffsetTop + padding;
            break;
          case "top-right":
            ctx.textAlign = "right";
            ctx.textBaseline = "top";
            watermarkX = imageWrapOffsetLeft + imageWrapWidth - padding;
            watermarkY = imageWrapOffsetTop + padding;
            break;
          case "middle-left":
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            watermarkX = imageWrapOffsetLeft + padding;
            watermarkY = imageWrapOffsetTop + imageWrapHeight / 2;
            break;
          case "middle-center":
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            watermarkX = imageWrapOffsetLeft + imageWrapWidth / 2;
            watermarkY = imageWrapOffsetTop + imageWrapHeight / 2;
            break;
          case "middle-right":
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            watermarkX = imageWrapOffsetLeft + imageWrapWidth - padding;
            watermarkY = imageWrapOffsetTop + imageWrapHeight / 2;
            break;
          case "bottom-left":
            ctx.textAlign = "left";
            ctx.textBaseline = "bottom";
            watermarkX = imageWrapOffsetLeft + padding;
            watermarkY = imageWrapOffsetTop + imageWrapHeight - padding;
            break;
          case "bottom-right":
            ctx.textAlign = "right";
            ctx.textBaseline = "bottom";
            watermarkX = imageWrapOffsetLeft + imageWrapWidth - padding;
            watermarkY = imageWrapOffsetTop + imageWrapHeight - padding;
            break;
          case "bottom-center":
          default:
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            watermarkX = imageWrapOffsetLeft + imageWrapWidth / 2;
            watermarkY = imageWrapOffsetTop + imageWrapHeight - padding;
            break;
        }

        ctx.fillText(watermarkText, watermarkX, watermarkY);
      }
    }

    const base64 = croppedCanvas.toDataURL("image/png").split(",")[1];

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

      await Filesystem.writeFile({
        path: filePath,
        data: base64,
        directory: Directory.External,
        recursive: true,
      });

      console.log("✅ Image saved:", filePath);

      // Verify the file was actually written
      try {
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
  } finally {
    // Safely remove wrapper from DOM if it's still there
    // html2canvas may have already removed it with removeContainer: true
    if (wrapper && wrapper.parentNode === document.body) {
      try {
        document.body.removeChild(wrapper);
      } catch (removeErr) {
        console.warn("⚠️ Failed to remove wrapper from DOM:", removeErr.message);
      }
    }
  }
}
