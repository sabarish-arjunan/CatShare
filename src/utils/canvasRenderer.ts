/**
 * Canvas API Rendering Utility
 * Replaces html2canvas with native Canvas API for better performance
 */

/**
 * Load an image from URL or data URI and return as Image object
 */
export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('Image source is empty or undefined'));
      return;
    }

    const img = new Image();
    const timeout = setTimeout(() => {
      reject(new Error(`Image load timeout after 30s: ${src.substring(0, 50)}...`));
    }, 30000);

    img.onload = () => {
      clearTimeout(timeout);
      console.log(`[loadImage] Successfully loaded image. Dimensions: ${img.width}x${img.height}`);
      resolve(img);
    };

    img.onerror = (err) => {
      clearTimeout(timeout);
      console.error(`[loadImage] Error loading image:`, err);
      reject(new Error(`Failed to load image: ${src.substring(0, 100)}`));
    };

    // Only set crossOrigin for HTTP(S) URLs, not for data URLs or blob URLs
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    console.log(`[loadImage] Loading image with source type:`, {
      isDataUrl: src.startsWith('data:'),
      isBlob: src.startsWith('blob:'),
      isHttp: src.startsWith('http'),
      srcLength: src.length,
    });

    img.src = src;
  });
}

/**
 * Measure text width in canvas context
 */
function measureText(ctx: CanvasRenderingContext2D, text: string, font: string): number {
  const previousFont = ctx.font;
  ctx.font = font;
  const width = ctx.measureText(text).width;
  ctx.font = previousFont;
  return width;
}

/**
 * Draw wrapped text on canvas
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line.trim(), x, currentY);
    currentY += lineHeight;
  }

  return currentY;
}

/**
 * Parse CSS color string to RGB values
 */
function colorToRgb(color: string): { r: number; g: number; b: number } {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  // Handle rgb() format
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }
  // Default to black
  return { r: 0, g: 0, b: 0 };
}

/**
 * Check if color is light or dark
 */
function isLightColor(color: string): boolean {
  if (color.toLowerCase() === 'white' || color === '#ffffff') return true;
  const rgb = colorToRgb(color);
  const luminance = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return luminance > 128;
}

/**
 * Lighten a color by specified amount
 */
function lightenColor(color: string, amount: number): string {
  const rgb = colorToRgb(color);
  return `rgb(${Math.min(255, rgb.r + amount)}, ${Math.min(255, rgb.g + amount)}, ${Math.min(255, rgb.b + amount)})`;
}

/**
 * Draw a rounded rectangle on canvas context
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export interface ProductRenderOptions {
  width: number;
  height?: number;
  scale: number;
  bgColor: string;
  imageBgColor: string;
  fontColor: string;
  backgroundColor: string;
}

export interface ProductData {
  name: string;
  subtitle?: string;
  image: string;
  field1?: string;
  field2?: string;
  field2Unit?: string;
  field3?: string;
  field3Unit?: string;
  price?: string | number;
  priceUnit?: string;
  badge?: string;
  cropAspectRatio?: number;
}

/**
 * Draw detailed product card to canvas
 * Mimics the Save.jsx rendering: image + title + fields + price + watermark
 */
export async function renderProductToCanvas(
  product: ProductData,
  options: ProductRenderOptions,
  watermarkConfig?: {
    enabled: boolean;
    text: string;
    position: string;
  }
): Promise<HTMLCanvasElement> {
  console.log(`[renderProductToCanvas] Starting render for product:`, product.name);
  console.log(`[renderProductToCanvas] Options:`, options);

  const scale = options.scale || 3;
  const baseWidth = options.width;
  const cropAspectRatio = product.cropAspectRatio || 1;

  // Calculate required height for all content
  // Image section: baseWidth / cropAspectRatio
  // Details section: padding + title + subtitle + fields + price bar
  const imageSectionBaseHeight = baseWidth / cropAspectRatio;
  const detailsPaddingBase = 4; // Updated: 8 -> 4 (matching "4px 8px" padding in HTML)
  const titleFontSizeBase = 28;
  const subtitleFontSizeBase = 18;
  const fieldFontSizeBase = 17;
  const fieldLineHeightBase = fieldFontSizeBase * 1.4;
  const priceBarHeightBase = product.price ? 36 : 0;

  // Estimate details height
  let detailsHeight = detailsPaddingBase; // top padding (4px)
  detailsHeight += titleFontSizeBase + 3; // Updated: title + 3px spacing (matching margin: "0 0 3px 0")

  if (product.subtitle) {
    detailsHeight += subtitleFontSizeBase + 0; // Updated: subtitle with no margin bottom (matching margin: "0 0 0 0")
  }

  detailsHeight += 6; // spacing before fields (marginBottom: 6 on title div)

  // Field heights (only count non-empty fields)
  if (product.field1) detailsHeight += fieldLineHeightBase + 2;
  if (product.field2) detailsHeight += fieldLineHeightBase + 2;
  if (product.field3) detailsHeight += fieldLineHeightBase + 2;

  detailsHeight += 6; // spacing after fields
  detailsHeight += priceBarHeightBase;
  detailsHeight += detailsPaddingBase; // bottom padding (4px)

  const baseHeight = imageSectionBaseHeight + detailsHeight;

  // Canvas dimensions at scale
  const canvasWidth = baseWidth * scale;
  const canvasHeight = baseHeight * scale;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context from canvas');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fill background
  ctx.fillStyle = options.backgroundColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  let currentY = 0;

  // ===== IMAGE SECTION =====
  const imageBg = options.imageBgColor;
  const imageHeight = imageSectionBaseHeight * scale;

  // Draw image background with drop shadow (matching modal: 0 12px 15px -6px rgba(0, 0, 0, 0.4))
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 15 * scale;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 12 * scale;
  ctx.fillStyle = imageBg;
  ctx.fillRect(0, currentY, canvasWidth, imageHeight);
  ctx.restore();

  // Load and draw image
  try {
    if (!product.image) {
      throw new Error('Product image is not set');
    }

    console.log(`Loading image: ${product.image}`);
    const img = await loadImage(product.image);
    console.log(`Image loaded successfully. Dimensions: ${img.width}x${img.height}`);

    // Center image in the available space
    const imgScaledWidth = canvasWidth;
    const imgScaledHeight = (img.height / img.width) * canvasWidth;

    if (imgScaledHeight >= imageHeight) {
      // Image is taller, fit by width
      ctx.drawImage(img, 0, currentY, canvasWidth, imageHeight);
    } else {
      // Image is wider, center vertically
      const offsetY = currentY + (imageHeight - imgScaledHeight) / 2;
      ctx.drawImage(img, 0, offsetY, canvasWidth, imgScaledHeight);
    }
    console.log(`Image drawn to canvas`);
  } catch (err) {
    console.error('Failed to load image:', err);
    // Draw placeholder instead of silently failing
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(0, currentY, canvasWidth, imageHeight);
    ctx.fillStyle = '#999999';
    ctx.font = `${Math.floor(20 * scale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Image not found', canvasWidth / 2, currentY + imageHeight / 2);
  }

  // Draw badge if present (rounded pill shape matching modal design)
  if (product.badge) {
    const badgeBg = isLightColor(imageBg) ? '#fff' : '#000';
    const badgeText = isLightColor(imageBg) ? '#000' : '#fff';
    const badgeBorder = isLightColor(imageBg) ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)';

    const badgeText_str = product.badge.toUpperCase();
    const badgeFontSize = Math.floor(11 * scale); // Updated: 13 -> 11
    const badgeFont = `700 ${badgeFontSize}px Arial, sans-serif`; // Updated: Added fontWeight 700

    ctx.font = badgeFont;
    const badgeMetrics = ctx.measureText(badgeText_str);
    const badgePadding = 4.5 * scale; // Updated: 6 -> 4.5 (4px 9px)
    const badgeWidth = badgeMetrics.width + badgePadding * 2;
    const badgeHeight = badgeFontSize + badgePadding;
    const badgeRadius = 10 * scale; // Updated: height/2 -> 10px (20px borderRadius)

    const badgeX = canvasWidth - badgeWidth - 8 * scale; // Updated: 10 -> 8px
    const badgeY = currentY + imageHeight - badgeHeight - 8 * scale; // Updated: 10 -> 8px

    // Draw rounded rectangle badge background (more defined pill shape)
    ctx.fillStyle = badgeBg;
    ctx.globalAlpha = 0.98; // Updated: 0.95 -> 0.98
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, badgeRadius);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Badge border - more prominent
    ctx.strokeStyle = badgeBorder;
    ctx.lineWidth = 1.5 * scale; // Updated: 1 -> 1.5
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, badgeRadius);
    ctx.stroke();

    // Badge text
    ctx.fillStyle = badgeText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText_str, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);
  }

  currentY += imageHeight;

  // ===== DETAILS SECTION =====
  const detailsBgColor = lightenColor(options.bgColor, 40);
  const renderDetailsPadding = detailsPaddingBase * scale;

  ctx.fillStyle = detailsBgColor;
  ctx.fillRect(0, currentY, canvasWidth, canvasHeight - currentY);

  ctx.fillStyle = options.fontColor;
  ctx.textAlign = 'left';

  // Title
  const renderTitleFontSize = Math.floor(titleFontSizeBase * scale);
  const titleFont = `normal ${renderTitleFontSize}px Arial, sans-serif`;
  ctx.font = titleFont;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 5 * scale;
  ctx.shadowOffsetX = 3 * scale;
  ctx.shadowOffsetY = 3 * scale;
  ctx.textAlign = 'center';
  ctx.fillText(product.name, canvasWidth / 2, currentY + renderDetailsPadding + renderTitleFontSize * 0.8);
  ctx.shadowColor = 'transparent';
  ctx.textAlign = 'left';

  currentY += renderDetailsPadding + renderTitleFontSize + 3 * scale; // Title height + title bottom margin (3px in HTML p tag)

  // Subtitle
  if (product.subtitle) {
    const renderSubtitleFontSize = Math.floor(subtitleFontSizeBase * scale);
    const subtitleFont = `italic ${renderSubtitleFontSize}px Arial, sans-serif`;
    ctx.font = subtitleFont;
    ctx.textAlign = 'center';
    ctx.fillText(`(${product.subtitle})`, canvasWidth / 2, currentY + renderSubtitleFontSize * 0.8);
    ctx.textAlign = 'left';
    currentY += renderSubtitleFontSize; // Updated: removed + 5 * scale spacing (matching HTML margin: "0 0 0 0")
  }

  currentY += 6 * scale;

  // Fields - Match HTML format with aligned colons
  const renderFieldFontSize = Math.floor(fieldFontSizeBase * scale);
  const fieldFont = `${renderFieldFontSize}px Arial, sans-serif`;
  const renderFieldLineHeight = renderFieldFontSize * 1.4;

  ctx.font = fieldFont;
  ctx.textAlign = 'left';

  // Measure the longest label to align colons
  const labels = ['Colour', 'Package', 'Age Group'];
  let maxLabelWidth = 0;
  labels.forEach(label => {
    const metrics = ctx.measureText(label);
    maxLabelWidth = Math.max(maxLabelWidth, metrics.width);
  });

  const fieldsLeftPadding = 12 * scale; // Increased left padding for fields (matching HTML)
  const colonX = fieldsLeftPadding + maxLabelWidth + 6 * scale; // Colon position aligned
  const valueX = colonX + 16 * scale; // Space after colon

  if (product.field1) {
    ctx.fillText('Colour', fieldsLeftPadding, currentY + renderFieldFontSize * 0.8);
    ctx.fillText(':', colonX, currentY + renderFieldFontSize * 0.8);
    ctx.fillText(product.field1, valueX, currentY + renderFieldFontSize * 0.8);
    currentY += renderFieldLineHeight + 2 * scale;
  }

  if (product.field2) {
    ctx.fillText('Package', fieldsLeftPadding, currentY + renderFieldFontSize * 0.8);
    ctx.fillText(':', colonX, currentY + renderFieldFontSize * 0.8);
    const field2Text = `${product.field2} ${product.field2Unit || ''}`;
    ctx.fillText(field2Text, valueX, currentY + renderFieldFontSize * 0.8);
    currentY += renderFieldLineHeight + 2 * scale;
  }

  if (product.field3) {
    ctx.fillText('Age Group', fieldsLeftPadding, currentY + renderFieldFontSize * 0.8);
    ctx.fillText(':', colonX, currentY + renderFieldFontSize * 0.8);
    const field3Text = `${product.field3} ${product.field3Unit || ''}`;
    ctx.fillText(field3Text, valueX, currentY + renderFieldFontSize * 0.8);
    currentY += renderFieldLineHeight + 2 * scale;
  }

  currentY += 6 * scale;

  // ===== PRICE BAR =====
  if (product.price !== undefined && product.price !== null && product.price !== '' && product.price !== 0) {
    // Fill entire remaining canvas with price bar background to avoid gaps
    const remainingHeight = canvasHeight - currentY;
    ctx.fillStyle = options.bgColor;
    ctx.fillRect(0, currentY, canvasWidth, remainingHeight); // Fill to bottom of canvas

    const priceFontSize = Math.floor(19 * scale);
    const priceFont = `${priceFontSize}px Arial, sans-serif`;
    ctx.font = priceFont;
    ctx.fillStyle = options.fontColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle'; // Perfect vertical centering

    // Center price text vertically in the remaining space
    const priceTextY = currentY + remainingHeight / 2; // Exact center without offset
    const priceText = `Price   :   ₹${product.price} ${product.priceUnit || ''}`;
    ctx.fillText(priceText, canvasWidth / 2, priceTextY);

    currentY += remainingHeight;
  }

  // ===== WATERMARK =====
  if (watermarkConfig?.enabled && watermarkConfig.text) {
    const watermarkFontSize = Math.floor(10 * scale);
    const watermarkFont = `${watermarkFontSize}px Arial, sans-serif`;
    ctx.font = watermarkFont;

    const isLightBg = isLightColor(imageBg);
    ctx.fillStyle = isLightBg ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.4)';

    // Position calculation for image section only
    const imageWrapWidth = canvasWidth;
    const imageWrapHeight = baseWidth / cropAspectRatio * scale;
    const imageWrapOffsetTop = 0;
    const padding = 10 * scale;

    let watermarkX = canvasWidth / 2;
    let watermarkY = imageWrapOffsetTop + imageWrapHeight - padding;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    switch (watermarkConfig.position) {
      case 'top-left':
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        watermarkX = padding;
        watermarkY = imageWrapOffsetTop + padding;
        break;
      case 'top-center':
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        watermarkX = imageWrapWidth / 2;
        watermarkY = imageWrapOffsetTop + padding;
        break;
      case 'top-right':
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        watermarkX = imageWrapWidth - padding;
        watermarkY = imageWrapOffsetTop + padding;
        break;
      case 'middle-left':
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        watermarkX = padding;
        watermarkY = imageWrapOffsetTop + imageWrapHeight / 2;
        break;
      case 'middle-center':
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        watermarkX = imageWrapWidth / 2;
        watermarkY = imageWrapOffsetTop + imageWrapHeight / 2;
        break;
      case 'middle-right':
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        watermarkX = imageWrapWidth - padding;
        watermarkY = imageWrapOffsetTop + imageWrapHeight / 2;
        break;
      case 'bottom-left':
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        watermarkX = padding;
        watermarkY = imageWrapOffsetTop + imageWrapHeight - padding;
        break;
      case 'bottom-right':
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        watermarkX = imageWrapWidth - padding;
        watermarkY = imageWrapOffsetTop + imageWrapHeight - padding;
        break;
      case 'bottom-center':
      default:
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        watermarkX = imageWrapWidth / 2;
        watermarkY = imageWrapOffsetTop + imageWrapHeight - padding;
        break;
    }

    ctx.fillText(watermarkConfig.text, watermarkX, watermarkY);
  }

  console.log(`[renderProductToCanvas] Canvas rendered successfully. Size: ${canvas.width}x${canvas.height}`);
  return canvas;
}

/**
 * Convert canvas to blob
 */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to convert canvas to blob'));
      }
    }, 'image/png');
  });
}

/**
 * Convert canvas to base64 PNG
 */
export function canvasToBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png').split(',')[1];
}

/**
 * Render simple card element to canvas
 * For quick downloads from CatalogueView, Wholesale, Resell
 */
export async function renderElementToCanvas(
  element: HTMLElement,
  options: { scale: number; backgroundColor: string; width: number; height: number }
): Promise<HTMLCanvasElement> {
  const scale = options.scale || 3;
  const width = options.width * scale;
  const height = options.height * scale;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context from canvas');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fill background
  ctx.fillStyle = options.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // For simple card elements, we'll measure and render the visible image
  const img = element.querySelector('img') as HTMLImageElement;
  if (img && img.src) {
    try {
      const loadedImg = await loadImage(img.src);
      // Draw image centered
      const imgAspectRatio = loadedImg.width / loadedImg.height;
      const containerAspectRatio = width / height;

      let drawWidth = width;
      let drawHeight = height;
      let drawX = 0;
      let drawY = 0;

      if (imgAspectRatio > containerAspectRatio) {
        // Image is wider
        drawHeight = width / imgAspectRatio;
        drawY = (height - drawHeight) / 2;
      } else {
        // Image is taller
        drawWidth = height * imgAspectRatio;
        drawX = (width - drawWidth) / 2;
      }

      ctx.drawImage(loadedImg, drawX, drawY, drawWidth, drawHeight);
    } catch (err) {
      console.warn('Failed to load image for card:', err);
    }
  }

  return canvas;
}
