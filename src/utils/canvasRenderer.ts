/**
 * Canvas API-based product image renderer
 * Renders product cards directly using HTML5 Canvas API (no html2canvas dependency)
 */

export interface ProductRenderData {
  name: string;
  subtitle?: string;
  image?: string;
  field1: string;
  field2: string;
  field2Unit: string;
  field3: string;
  field3Unit: string;
  price?: string | number;
  priceUnit?: string;
  badge?: string;
  cropAspectRatio?: number;
}

export interface RenderOptions {
  width: number;
  scale: number;
  bgColor: string;
  imageBgColor: string;
  fontColor: string;
  backgroundColor: string;
}

export interface WatermarkOptions {
  enabled: boolean;
  text: string;
  position: string;
}

/**
 * Load image as HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

/**
 * Convert hex color to RGB array
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [173, 216, 230]; // Light blue fallback
}

/**
 * Check if background is light or dark
 */
function isLightBackground(color: string): boolean {
  if (color.toLowerCase() === "white" || color === "#ffffff" || color === "#fff") {
    return true;
  }
  
  const [r, g, b] = color.startsWith("#") ? hexToRgb(color) : [173, 216, 230];
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

/**
 * Render product to Canvas using native Canvas API
 */
export async function renderProductToCanvas(
  productData: ProductRenderData,
  options: RenderOptions,
  watermark: WatermarkOptions
): Promise<HTMLCanvasElement> {
  const {
    width,
    scale,
    bgColor,
    imageBgColor,
    fontColor,
    backgroundColor,
  } = options;

  const scaledWidth = width * scale;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Failed to get canvas context");

  // Calculate dimensions
  const priceBarHeight = 36 * scale; // Price bar height
  const imagePadding = 16 * scale;
  const imageHeight = 300 * scale;
  const detailsPadding = 10 * scale;
  const textLineHeight = 24 * scale;
  const totalHeight = priceBarHeight + imagePadding + imageHeight + imagePadding + (detailsPadding * 8) + detailsPadding;

  canvas.width = scaledWidth;
  canvas.height = totalHeight;

  let yOffset = 0;

  // Draw price bar (top)
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, yOffset, scaledWidth, priceBarHeight);

  // Draw price text
  ctx.fillStyle = fontColor;
  ctx.font = `bold ${19 * scale}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    `Price   :   ₹${productData.price || 0} ${productData.priceUnit || ""}`,
    scaledWidth / 2,
    yOffset + priceBarHeight / 2
  );

  yOffset += priceBarHeight;

  // Draw image background and image
  ctx.fillStyle = imageBgColor;
  ctx.fillRect(0, yOffset, scaledWidth, imageHeight + imagePadding * 2);

  // Load and draw product image
  if (productData.image) {
    try {
      const img = await loadImage(productData.image);
      const maxImgWidth = scaledWidth - imagePadding * 2;
      const maxImgHeight = imageHeight;
      
      let imgWidth = img.width;
      let imgHeight = img.height;
      
      // Scale image to fit
      const imgRatio = imgWidth / imgHeight;
      const containerRatio = maxImgWidth / maxImgHeight;
      
      if (imgRatio > containerRatio) {
        imgWidth = maxImgWidth;
        imgHeight = maxImgWidth / imgRatio;
      } else {
        imgHeight = maxImgHeight;
        imgWidth = maxImgHeight * imgRatio;
      }

      // Center image
      const imgX = (scaledWidth - imgWidth) / 2;
      const imgY = yOffset + imagePadding + (maxImgHeight - imgHeight) / 2;

      ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);

      // Draw badge if present
      if (productData.badge) {
        const badgeBg = isLightBackground(imageBgColor) ? "#fff" : "#000";
        const badgeText = isLightBackground(imageBgColor) ? "#000" : "#fff";
        const badgeBorder = isLightBackground(imageBgColor) ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.4)";

        const badgeX = imgX + imgWidth - 60 * scale;
        const badgeY = imgY + imgHeight - 35 * scale;
        const badgeWidth = 55 * scale;
        const badgeHeight = 25 * scale;

        // Badge background
        ctx.fillStyle = badgeBg;
        ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);

        // Badge border
        ctx.strokeStyle = badgeBorder;
        ctx.lineWidth = 1 * scale;
        ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);

        // Badge text
        ctx.fillStyle = badgeText;
        ctx.font = `bold ${13 * scale}px Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          productData.badge.toUpperCase(),
          badgeX + badgeWidth / 2,
          badgeY + badgeHeight / 2
        );
      }
    } catch (err) {
      console.warn("Failed to load product image:", err);
    }
  }

  yOffset += imageHeight + imagePadding * 2;

  // Draw product details section
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, yOffset, scaledWidth, detailsPadding * 8 + detailsPadding);

  ctx.fillStyle = fontColor;
  ctx.font = `bold ${28 * scale}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const nameY = yOffset + detailsPadding;
  ctx.fillText(productData.name, scaledWidth / 2, nameY);

  // Subtitle
  if (productData.subtitle) {
    ctx.font = `italic ${18 * scale}px Arial, sans-serif`;
    ctx.fillText(`(${productData.subtitle})`, scaledWidth / 2, nameY + textLineHeight);
  }

  // Details section
  ctx.textAlign = "left";
  ctx.font = `normal ${17 * scale}px Arial, sans-serif`;
  const detailsX = detailsPadding;
  let detailsY = nameY + (productData.subtitle ? textLineHeight * 2 : textLineHeight);

  ctx.fillText(`Colour            : ${productData.field1}`, detailsX, detailsY);
  detailsY += textLineHeight;
  ctx.fillText(`Package     : ${productData.field2} ${productData.field2Unit}`, detailsX, detailsY);
  detailsY += textLineHeight;
  ctx.fillText(`Age Group  : ${productData.field3} ${productData.field3Unit}`, detailsX, detailsY);

  // Apply watermark if enabled
  if (watermark.enabled && watermark.text) {
    const watermarkSize = 10 * scale;
    ctx.font = `${Math.floor(watermarkSize)}px Arial, sans-serif`;
    ctx.fillStyle = isLightBackground(imageBgColor) ? "rgba(0, 0, 0, 0.25)" : "rgba(255, 255, 255, 0.4)";

    const padding = 10 * scale;
    const imageWrapTop = priceBarHeight;
    const imageWrapHeight = imageHeight + imagePadding * 2;
    let watermarkX = 0;
    let watermarkY = 0;

    switch (watermark.position) {
      case "top-left":
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        watermarkX = padding;
        watermarkY = imageWrapTop + padding;
        break;
      case "top-center":
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        watermarkX = scaledWidth / 2;
        watermarkY = imageWrapTop + padding;
        break;
      case "top-right":
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        watermarkX = scaledWidth - padding;
        watermarkY = imageWrapTop + padding;
        break;
      case "middle-left":
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        watermarkX = padding;
        watermarkY = imageWrapTop + imageWrapHeight / 2;
        break;
      case "middle-center":
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        watermarkX = scaledWidth / 2;
        watermarkY = imageWrapTop + imageWrapHeight / 2;
        break;
      case "middle-right":
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        watermarkX = scaledWidth - padding;
        watermarkY = imageWrapTop + imageWrapHeight / 2;
        break;
      case "bottom-left":
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        watermarkX = padding;
        watermarkY = imageWrapTop + imageWrapHeight - padding;
        break;
      case "bottom-right":
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        watermarkX = scaledWidth - padding;
        watermarkY = imageWrapTop + imageWrapHeight - padding;
        break;
      case "bottom-center":
      default:
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        watermarkX = scaledWidth / 2;
        watermarkY = imageWrapTop + imageWrapHeight - padding;
        break;
    }

    ctx.fillText(watermark.text, watermarkX, watermarkY);
  }

  return canvas;
}

/**
 * Convert canvas to base64 PNG string
 */
export function canvasToBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png").split(",")[1];
}
