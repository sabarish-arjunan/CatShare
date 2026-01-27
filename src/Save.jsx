import { Filesystem, Directory, FilesystemDirectory } from "@capacitor/filesystem";
import html2canvas from "html2canvas-pro";

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

  const priceUnit = type === "resell" ? units.resellUnit : units.wholesaleUnit;
  const price = type === "resell" ? product.resell : product.wholesale;

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

  if (type === "wholesale") {
    container.appendChild(priceBar); // Price on top
  }

  const imageShadowWrap = document.createElement("div");
  Object.assign(imageShadowWrap.style, {
    boxShadow: "0 12px 15px -6px rgba(0, 0, 0, 0.4)",
    marginBottom: "1px",
    borderRadius: "0",
  });

  const imageWrap = document.createElement("div");
  Object.assign(imageWrap.style, {
    backgroundColor: imageBg,
    textAlign: "center",
    padding: "16px",
    position: "relative",
    overflow: "visible",
  });

  const img = document.createElement("img");
  img.alt = product.name;
  img.style.maxWidth = "100%";
  img.style.maxHeight = "300px";
  img.style.objectFit = "contain";
  img.style.margin = "0 auto";
  imageWrap.appendChild(img);
  img.src = product.image;

  await new Promise((resolve) => {
    img.onload = resolve;
    img.onerror = resolve;
  });

  if (product.badge) {
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
    badge.innerText = product.badge.toUpperCase();
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
      <p style="font-weight:normal;text-shadow:3px 3px 5px rgba(0,0,0,0.2);font-size:28px;margin:3px">${product.name}</p>
      ${product.subtitle ? `<p style="font-style:italic;font-size:18px;margin:5px">(${product.subtitle})</p>` : ""}
    </div>
    <div style="text-align:left;line-height:1.4">
      <p style="margin:2px 0">Colour &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: &nbsp;&nbsp;${product.color}</p>
      <p style="margin:2px 0">Package &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: &nbsp;&nbsp;${product.package} ${units.packageUnit}</p>
      <p style="margin:2px 0">Age Group &nbsp;&nbsp;: &nbsp;&nbsp;${product.age} ${units.ageGroupUnit}</p>
    </div>
  `;
  container.appendChild(details);

  if (type === "resell") {
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
    const isWatermarkEnabled = showWatermark !== null ? JSON.parse(showWatermark) : true; // Default: true

    if (isWatermarkEnabled) {
      // Get custom watermark text from localStorage, default to "created using CatShare"
      const watermarkText = localStorage.getItem("watermarkText") || "created using CatShare";
      const watermarkSize = Math.max(12, croppedCanvas.width / 40); // Responsive font size
      ctx.font = `${Math.floor(watermarkSize)}px Arial, sans-serif`;

      // Check if background is light or dark and set watermark color accordingly
      const isLightBg = imageBg.toLowerCase() === "white" || imageBg.toLowerCase() === "#ffffff";
      ctx.fillStyle = isLightBg ? "rgba(0, 0, 0, 0.25)" : "rgba(255, 255, 255, 0.4)"; // Dark gray for light bg, white for dark bg

      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";

      // Position watermark at bottom center of image, with padding
      const watermarkX = croppedCanvas.width / 2;
      const watermarkY = croppedCanvas.height - Math.floor(watermarkSize / 2) - 8;
      ctx.fillText(watermarkText, watermarkX, watermarkY);
    }

    const base64 = croppedCanvas.toDataURL("image/png").split(",")[1];
    const filename = `product_${id}_${type}.png`;
    const folder = type === "wholesale" ? "Wholesale" : "Resell";

    const filePath = `${folder}/${filename}`;

    try {
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
      } catch (verifyErr) {
        console.warn(`⚠️ Could not verify file after write: ${filePath}`, verifyErr);
      }
    } catch (writeErr) {
      console.error(`❌ Failed to write file: ${filePath}`, writeErr);
      throw writeErr;
    }
  } catch (err) {
    console.error("❌ saveRenderedImage failed:", err.message || err);
  } finally {
    document.body.removeChild(wrapper);
  }
}
