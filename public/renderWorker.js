// renderWorker.js - Web Worker for handling PNG rendering off the main thread
// This allows the UI to remain responsive while rendering happens in the background
// Uses Canvas API for rendering instead of html2canvas

let isRendering = false;

/**
 * Load image with timeout
 */
function loadImageWithTimeout(src, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      reject(new Error(`Image load timeout: ${src}`));
    }, timeout);

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error(`Failed to load image: ${src}`));
    };

    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

/**
 * Render HTML element to canvas using Canvas API
 */
async function renderHtmlElementToCanvas(element, options) {
  const scale = options.scale || 3;
  const width = element.offsetWidth || 400;
  const height = element.offsetHeight || 400;

  const canvasWidth = width * scale;
  const canvasHeight = height * scale;

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

  // Scale context for rendering
  ctx.scale(scale, scale);

  try {
    // Draw images
    const images = element.querySelectorAll('img');
    for (const img of images) {
      try {
        const style = window.getComputedStyle(img);
        const rect = img.getBoundingClientRect();
        const parentRect = img.parentElement?.getBoundingClientRect();

        if (rect.width > 0 && rect.height > 0) {
          let x = rect.left - (parentRect?.left || 0);
          let y = rect.top - (parentRect?.top || 0);

          const loadedImg = await loadImageWithTimeout(img.src, options.imageTimeout);
          ctx.drawImage(loadedImg, x, y, rect.width, rect.height);
        }
      } catch (err) {
        console.warn('Failed to load image in worker:', err);
        // Continue with other images
      }
    }

    // Draw backgrounds
    const allElements = element.querySelectorAll('*');
    for (const el of allElements) {
      const style = window.getComputedStyle(el);
      const bgColor = style.backgroundColor;

      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        const rect = el.getBoundingClientRect();
        const parentRect = el.parentElement?.getBoundingClientRect();

        const x = rect.left - (parentRect?.left || 0);
        const y = rect.top - (parentRect?.top || 0);

        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, rect.width, rect.height);
      }
    }

    // Draw text
    const textElements = element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
    for (const textEl of textElements) {
      if (textEl.children.length === 0) {
        // Only draw leaf nodes with text
        const text = textEl.textContent?.trim();
        if (text) {
          const style = window.getComputedStyle(textEl);
          const rect = textEl.getBoundingClientRect();
          const parentRect = textEl.parentElement?.getBoundingClientRect();

          const x = rect.left - (parentRect?.left || 0);
          const y = rect.top - (parentRect?.top || 0);

          ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          ctx.fillStyle = style.color;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(text, x, y, rect.width);
        }
      }
    }
  } catch (err) {
    console.warn('Error rendering HTML to canvas:', err);
    // Canvas already has background, continue
  }

  return canvas;
}

// Listen for render commands from the main thread
self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (type === 'RENDER_IMAGE') {
    const { htmlContent, productId, catalogueLabel, type: catalogueType, options } = payload;

    try {
      // Send progress update
      self.postMessage({
        type: 'PROGRESS',
        data: { status: 'rendering', productId, message: `Rendering ${productId}...` }
      });

      // Render the HTML to canvas using Canvas API
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.opacity = '0';
      document.body.appendChild(tempDiv);

      const canvas = await renderHtmlElementToCanvas(tempDiv, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: false,
        imageTimeout: 5000,
      });

      // Convert to base64
      const base64 = canvas.toDataURL('image/png').split(',')[1];

      // Clean up
      document.body.removeChild(tempDiv);
      canvas.width = 0;
      canvas.height = 0;

      // Send success message with base64 data
      self.postMessage({
        type: 'RENDER_COMPLETE',
        data: {
          productId,
          catalogueLabel,
          catalogueType,
          base64,
          success: true
        }
      });

    } catch (error) {
      // Send error message
      self.postMessage({
        type: 'RENDER_ERROR',
        data: {
          productId,
          catalogueLabel,
          error: error.message
        }
      });
    }
  }

  if (type === 'CANCEL') {
    isRendering = false;
    self.postMessage({ type: 'CANCELLED' });
  }
};
