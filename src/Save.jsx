import { Filesystem, Directory } from "@capacitor/filesystem";
import html2canvas from "html2canvas-pro";
import { getCatalogueData } from "./config/catalogueProductUtils";

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

  const wrapper = document.createElement("div");
  Object.assign(wrapper.style, {
    position: "absolute",
    top: "0",
    left: "0",
    width: "330px",
    backgroundColor: "transparent",
    opacity: "0",
    pointerEvents: "none",
    overflow: "visible",
    padding: "0",
    boxSizing: "border-box",
  });

  const container = document.createElement("div");
  container.className = `full-detail-${id}-${type}`;
  container.style.backgroundColor = getLighterColor(bgColor);
  container.style.overflow = "visible";

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

  const priceBar = document.createElement("h2");
  Object.assign(priceBar.style, {
    backgroundColor: bgColor,
    color: fontColor,
    padding: "8px",
    textAlign: "center",
    fontWeight: "normal",
    fontSize: "19px",
    margin: 0,
    lineHeight: 1.2,
  });
  priceBar.innerText = `Price   :   ₹${price} ${priceUnit}`;

  // Price bar at bottom for all catalogues
  const isPriceOnTop = false;

  if (isPriceOnTop) {
    container.appendChild(priceBar); // Price on top
  }

  const imageShadowWrap = document.createElement("div");
  Object.assign(imageShadowWrap.style, {
    boxShadow: "0 12px 15px -6px rgba(0, 0, 0, 0.4)",
    marginBottom: "1px",
    borderRadius: "0",
  });
  imageShadowWrap.id = `image-shadow-wrap-${id}`;

  const imageWrap = document.createElement("div");
  Object.assign(imageWrap.style, {
    backgroundColor: imageBg,
    textAlign: "center",
    padding: "16px",
    position: "relative",
    overflow: "visible",
  });
  imageWrap.id = `image-wrap-${id}`;

  const img = document.createElement("img");
  img.alt = catalogueData.name;
  img.style.maxWidth = "100%";
  img.style.maxHeight = "300px";
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
  details.innerHTML = `
    <div style="text-align:center;margin-bottom:6px">
      <p style="font-weight:normal;text-shadow:3px 3px 5px rgba(0,0,0,0.2);font-size:28px;margin:3px">${catalogueData.name}</p>
      ${catalogueData.subtitle ? `<p style="font-style:italic;font-size:18px;margin:5px">(${catalogueData.subtitle})</p>` : ""}
    </div>
    <div style="text-align:left;line-height:1.4">
      <p style="margin:2px 0">Colour &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: &nbsp;&nbsp;${catalogueData.field1}</p>
      <p style="margin:2px 0">Package &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: &nbsp;&nbsp;${catalogueData.field2} ${catalogueData.field2Unit}</p>
      <p style="margin:2px 0">Age Group &nbsp;&nbsp;: &nbsp;&nbsp;${catalogueData.field3} ${catalogueData.field3Unit}</p>
    </div>
  `;
  container.appendChild(details);

  if (!isPriceOnTop) {
    container.appendChild(priceBar); // Price at bottom
  }

  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  await new Promise((r) => setTimeout(r, 30));
  wrapper.style.opacity = "1";

  try {
    const canvas = await html2canvas(wrapper, {
      scale: 3,
      backgroundColor: "#ffffff",
    });

    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = canvas.width;
    croppedCanvas.height = canvas.height - 3;

    const ctx = croppedCanvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0);

    // Add watermark - Only if enabled in settings
    const showWatermark = localStorage.getItem("showWatermark");
    const isWatermarkEnabled = showWatermark !== null ? JSON.parse(showWatermark) : false; // Default: false (disabled)

    if (isWatermarkEnabled) {
      // Get custom watermark text from localStorage, default to "Created using CatShare"
      const watermarkText = localStorage.getItem("watermarkText") || "Created using CatShare";
      const watermarkPosition = localStorage.getItem("watermarkPosition") || "bottom-center";

      // Get the imageWrap and imageShadowWrap elements to determine position in the rendered canvas
      const imageWrapEl = document.getElementById(`image-wrap-${id}`);
      const imageShadowWrapEl = document.getElementById(`image-shadow-wrap-${id}`);
      const containerEl = imageWrapEl?.closest(`.full-detail-${id}-${type}`);

      if (imageWrapEl && imageShadowWrapEl && containerEl) {
        // html2canvas renders at 3x scale
        const scale = 3;
        const containerWidth = 330; // wrapper width in px
        const scaledContainerWidth = containerWidth * scale;

        // Get the computed dimensions of the image wrap
        const imageWrapStyle = window.getComputedStyle(imageWrapEl);
        const imageShadowWrapStyle = window.getComputedStyle(imageShadowWrapEl);
        const imagePadding = 16; // padding in imageWrap

        // Calculate dimensions accounting for all parent elements
        const imageWrapWidth = containerWidth * scale; // Full container width

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

        imageWrapOffsetTop *= scale;

        // Image section height includes padding and the image itself
        const imageWrapHeight = imageWrapEl.offsetHeight * scale;
        const imageWrapOffsetLeft = 0;

        // Watermark font size should be relative to image section width
        // Matches the preview sizing logic
        const previewFontSize = 10; // Base font size in preview
        const watermarkSize = previewFontSize * scale; // Scale up proportionally
        ctx.font = `${Math.floor(watermarkSize)}px Arial, sans-serif`;

        // Check if background is light or dark and set watermark color accordingly
        const isLightBg = imageBg.toLowerCase() === "white" || imageBg.toLowerCase() === "#ffffff";
        ctx.fillStyle = isLightBg ? "rgba(0, 0, 0, 0.25)" : "rgba(255, 255, 255, 0.4)";

        // Calculate position based on watermarkPosition, relative to image section only
        const padding = 10 * scale; // Scale padding to match canvas scale (50% towards corner)
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
    const filename = `product_${id}_${type}.png`;

    // Use catalogueId if provided, otherwise fall back to legacy type mapping
    let folder;
    if (units.catalogueId) {
      // New catalogue system: use catalogue ID to create folder name
      folder = units.catalogueId;
    } else {
      // Legacy support: map old types to folder names
      folder = type === "wholesale" ? "Wholesale" : type === "resell" ? "Resell" : type;
    }

    await Filesystem.writeFile({
      path: `${folder}/${filename}`,
      data: base64,
      directory: Directory.External,
      recursive: true,
    });

    console.log("✅ Image saved:", `${folder}/${filename}`);
  } catch (err) {
    console.error("❌ saveRenderedImage failed:", err.message || err);
  } finally {
    document.body.removeChild(wrapper);
  }
}
