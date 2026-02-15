/**
 * Glass Theme Canvas Rendering Utility
 * Renders products with glass morphism aesthetic
 */

import { loadImage } from './canvasRenderer';
import { isLightColor, lightenColor } from './canvasRenderer';
import { getAllFields } from '../config/fieldConfig';

export interface ProductData {
  name: string;
  subtitle?: string;
  image?: string;
  price?: string | number;
  priceUnit?: string;
  badge?: string;
  cropAspectRatio?: number;
  [key: string]: any;
}

export interface ProductRenderOptions {
  width: number;
  scale: number;
  bgColor: string;
  imageBgColor: string;
  fontColor: string;
  backgroundColor: string;
  currencySymbol?: string;
}

function drawStadiumShape(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  const radius = Math.min(width, height) / 2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

export async function renderProductToCanvasGlass(
  product: ProductData,
  options: ProductRenderOptions,
  watermarkConfig?: {
    enabled: boolean;
    text: string;
    position: string;
  }
): Promise<HTMLCanvasElement> {
  console.log(`[renderProductToCanvasGlass] Starting render for product:`, product.name);
  console.log(`[renderProductToCanvasGlass] Options:`, options);

  const scale = options.scale || 3;
  const baseWidth = options.width;
  const cropAspectRatio = product.cropAspectRatio || 1;

  // Get all enabled fields
  const allEnabledFields = getAllFields().filter(f => f.enabled && f.key.startsWith('field'));

  // Calculate required height - similar to classic but adjusted for glass card layout
  const imageSectionBaseHeight = baseWidth / cropAspectRatio;
  const detailsPaddingBase = 8;
  const titleFontSizeBase = 27;
  const subtitleFontSizeBase = 17;
  const fieldFontSizeBase = 16;
  const fieldLineHeightBase = fieldFontSizeBase * 1.4;
  const priceBarHeightBase = product.price ? 28 : 0;

  const spacingAfterTitle = 12;
  const spacingAfterSubtitle = 10;
  const spacingBeforeFields = 12;
  const spacingAfterFields = 12;

  let detailsHeight = detailsPaddingBase;
  detailsHeight += 10;
  detailsHeight += titleFontSizeBase + spacingAfterTitle;

  if (product.subtitle) {
    detailsHeight += subtitleFontSizeBase + spacingAfterSubtitle;
  }

  detailsHeight += spacingBeforeFields;

  allEnabledFields.forEach(field => {
    const visibilityKey = `${field.key}Visible`;
    const isVisible = product[visibilityKey] !== false;

    if (product[field.key] && isVisible) {
      detailsHeight += fieldLineHeightBase + 2;
    }
  });

  detailsHeight += spacingAfterFields;
  detailsHeight += priceBarHeightBase;
  detailsHeight += detailsPaddingBase;

  const baseHeight = imageSectionBaseHeight + detailsHeight;

  const canvasWidth = baseWidth * scale;
  const canvasHeight = baseHeight * scale;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context from canvas');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fill background with gradient (glass theme aesthetic)
  const gradientBg = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradientBg.addColorStop(0, options.bgColor);
  gradientBg.addColorStop(0.5, lightenColor(options.bgColor, -20));
  gradientBg.addColorStop(1, options.bgColor);
  ctx.fillStyle = gradientBg;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  let currentY = 0;

  // ===== IMAGE SECTION =====
  const imageBg = options.imageBgColor;
  const imageHeight = imageSectionBaseHeight * scale;

  // Draw image background
  ctx.fillStyle = imageBg;
  ctx.fillRect(0, currentY, canvasWidth, imageHeight);

  // Load and draw image
  try {
    if (!product.image) {
      throw new Error('Product image is not set');
    }

    console.log(`Loading image: ${product.image}`);
    const img = await loadImage(product.image);
    console.log(`Image loaded successfully. Dimensions: ${img.width}x${img.height}`);

    const imgScaledWidth = canvasWidth;
    const imgScaledHeight = (img.height / img.width) * canvasWidth;

    if (imgScaledHeight >= imageHeight) {
      ctx.drawImage(img, 0, currentY, canvasWidth, imageHeight);
    } else {
      const offsetY = currentY + (imageHeight - imgScaledHeight) / 2;
      ctx.drawImage(img, 0, offsetY, canvasWidth, imgScaledHeight);
    }
    console.log(`Image drawn to canvas`);
  } catch (err) {
    console.error('Failed to load image:', err);
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(0, currentY, canvasWidth, imageHeight);
    ctx.fillStyle = '#999999';
    ctx.font = `${Math.floor(20 * scale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Image not found', canvasWidth / 2, currentY + imageHeight / 2);
  }

  // Draw badge with glass morphism effect
  if (product.badge) {
    const isWhiteBg = isLightColor(imageBg);
    const badgeBg = isWhiteBg ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.50)';
    const badgeText = isWhiteBg ? 'rgba(255, 255, 255, 0.95)' : '#000';
    const badgeBorder = isWhiteBg ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.8)';

    const badgeText_str = product.badge.toUpperCase();
    const badgeFontSize = Math.floor(13 * scale);
    const badgeFont = `600 ${badgeFontSize}px Arial, sans-serif`;

    ctx.font = badgeFont;
    const badgeMetrics = ctx.measureText(badgeText_str);

    const badgePaddingH = 14 * scale;
    const badgePaddingV = 8 * scale;
    const badgeWidth = badgeMetrics.width + badgePaddingH * 2;
    const badgeHeight = badgeFontSize + badgePaddingV * 2;

    const badgeX = canvasWidth - badgeWidth - 12 * scale;
    const badgeY = currentY + imageHeight - badgeHeight - 12 * scale;

    // Draw glass badge background
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = badgeBg;
    drawStadiumShape(ctx, badgeX, badgeY, badgeWidth, badgeHeight);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    // Badge border
    ctx.strokeStyle = badgeBorder;
    ctx.lineWidth = 1.5 * scale;
    drawStadiumShape(ctx, badgeX, badgeY, badgeWidth, badgeHeight);
    ctx.stroke();

    // Badge text
    ctx.fillStyle = badgeText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const badgeTextOffsetY = 1 * scale;
    ctx.fillText(badgeText_str, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2 + badgeTextOffsetY);
  }

  currentY += imageHeight;

  // ===== GLASS CARD DETAILS SECTION =====
  const cardMargin = 8 * scale;
  const cardX = cardMargin;
  const cardY = currentY - 30 * scale;
  const cardWidth = canvasWidth - 2 * cardMargin;
  const cardPadding = 16 * scale;

  // Glass card background with blur effect simulation
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';
  drawRoundedRect(ctx, cardX, cardY, cardWidth, detailsHeight * scale + 40 * scale, 14 * scale);
  ctx.fill();
  ctx.restore();

  // Glass card border
  ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
  ctx.lineWidth = 2 * scale;
  drawRoundedRect(ctx, cardX, cardY, cardWidth, detailsHeight * scale + 40 * scale, 14 * scale);
  ctx.stroke();

  // Draw content inside glass card
  currentY = cardY + 30 * scale;

  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';

  // Title
  const renderTitleFontSize = Math.floor(titleFontSizeBase * scale);
  const titleFont = `600 ${renderTitleFontSize}px Arial, sans-serif`;
  ctx.font = titleFont;
  ctx.fillText(product.name, canvasWidth / 2, currentY + renderTitleFontSize * 0.8);

  currentY += renderTitleFontSize + spacingAfterTitle * scale;

  // Subtitle
  if (product.subtitle) {
    const renderSubtitleFontSize = Math.floor(subtitleFontSizeBase * scale);
    const subtitleFont = `italic ${renderSubtitleFontSize}px Arial, sans-serif`;
    ctx.font = subtitleFont;
    ctx.fillText(`(${product.subtitle})`, canvasWidth / 2, currentY + renderSubtitleFontSize * 0.8);
    currentY += renderSubtitleFontSize + spacingAfterSubtitle * scale;
  }

  currentY += spacingBeforeFields * scale;

  // Fields
  const renderFieldFontSize = Math.floor(fieldFontSizeBase * scale);
  const fieldFont = `${renderFieldFontSize}px Arial, sans-serif`;
  const renderFieldLineHeight = renderFieldFontSize * 1.4;

  ctx.font = fieldFont;
  ctx.textAlign = 'center';

  const activeFields = allEnabledFields.filter(f => !!product[f.key]);
  activeFields.forEach(field => {
    const visibilityKey = `${field.key}Visible`;
    const isVisible = product[visibilityKey] !== false;

    if (!isVisible) return;

    const unitKey = `${field.key}Unit`;
    const val = product[field.key];
    const unit = product[unitKey];
    const displayText = unit && unit !== 'None' ? `${field.label}: ${val} ${unit}` : `${field.label}: ${val}`;

    ctx.fillText(displayText, canvasWidth / 2, currentY + renderFieldFontSize * 0.8);
    currentY += renderFieldLineHeight + 2 * scale;
  });

  currentY += spacingAfterFields * scale;

  // ===== PRICE BAR =====
  if (product.price !== undefined && product.price !== null && product.price !== '' && product.price !== 0) {
    const priceBgColor = options.bgColor;
    ctx.fillStyle = priceBgColor;

    // Draw price bar inside card or as separate element
    const priceBarHeight = priceBarHeightBase * scale;
    const priceBarY = currentY;

    ctx.fillRect(cardX, priceBarY - 4 * scale, cardWidth, priceBarHeight + 8 * scale);

    const priceFontSize = Math.floor(18 * scale);
    const priceFont = `600 ${priceFontSize}px Arial, sans-serif`;
    ctx.font = priceFont;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const currencySymbol = options.currencySymbol || '₹';
    const priceText = product.priceUnit && product.priceUnit !== 'None' 
      ? `₹${product.price} ${product.priceUnit}` 
      : `₹${product.price}`;
    
    ctx.fillText(priceText, canvasWidth / 2, priceBarY + priceBarHeight / 2);

    currentY += priceBarHeight;
  }

  // ===== WATERMARK =====
  if (watermarkConfig?.enabled && watermarkConfig.text) {
    const watermarkFontSize = Math.floor(10 * scale);
    const watermarkFont = `${watermarkFontSize}px Arial, sans-serif`;
    ctx.font = watermarkFont;

    const isLightBg = isLightColor(imageBg);
    ctx.fillStyle = isLightBg ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.4)';

    const imageWrapWidth = canvasWidth;
    const imageWrapHeight = baseWidth / cropAspectRatio * scale;
    const imageWrapOffsetTop = 0;
    const padding = 10 * scale;

    let watermarkX = canvasWidth / 2;
    let watermarkY = imageWrapOffsetTop + imageWrapHeight - padding;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    let normalizedPosition = (watermarkConfig.position || 'bottom-center').toString();

    if (normalizedPosition.startsWith('"') && normalizedPosition.endsWith('"')) {
      normalizedPosition = normalizedPosition.substring(1, normalizedPosition.length - 1);
    }

    normalizedPosition = normalizedPosition
      .replace(/_/g, '-')
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();

    console.log(`[Watermark Position] Config: ${watermarkConfig.position}, Normalized: ${normalizedPosition}`);

    switch (normalizedPosition) {
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

  console.log(`[renderProductToCanvasGlass] Canvas rendered successfully. Size: ${canvas.width}x${canvas.height}`);
  return canvas;
}
