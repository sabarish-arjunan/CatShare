/**
 * HTML to Canvas converter for Web Worker
 * Converts HTML strings to canvas in background thread
 */

/**
 * Load image with timeout
 */
function loadImageWithTimeout(src: string, timeout: number = 5000): Promise<HTMLImageElement> {
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
 * Render HTML element to canvas
 * Used in worker to convert HTML strings to PNG
 */
export async function renderHtmlElementToCanvas(
  element: HTMLElement,
  options: {
    scale: number;
    backgroundColor: string;
    useCORS: boolean;
    allowTaint: boolean;
    imageTimeout: number;
  }
): Promise<HTMLCanvasElement> {
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

  // Render element content
  try {
    // Draw images
    const images = element.querySelectorAll('img') as NodeListOf<HTMLImageElement>;
    for (const img of images) {
      try {
        const style = window.getComputedStyle(img);
        const rect = img.getBoundingClientRect();
        const parentRect = (img.parentElement as HTMLElement)?.getBoundingClientRect();
        
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

    // Draw text
    const textElements = element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, span');
    for (const textEl of textElements) {
      if (textEl.children.length === 0) {
        // Only draw leaf nodes with text
        const text = textEl.textContent?.trim();
        if (text) {
          const style = window.getComputedStyle(textEl);
          const rect = textEl.getBoundingClientRect();
          const parentRect = (textEl.parentElement as HTMLElement)?.getBoundingClientRect();

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

    // Draw backgrounds and borders
    const allElements = element.querySelectorAll('*');
    for (const el of allElements) {
      const style = window.getComputedStyle(el as HTMLElement);
      const bgColor = style.backgroundColor;
      
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        const rect = (el as HTMLElement).getBoundingClientRect();
        const parentRect = ((el as HTMLElement).parentElement as HTMLElement)?.getBoundingClientRect();
        
        const x = rect.left - (parentRect?.left || 0);
        const y = rect.top - (parentRect?.top || 0);

        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, rect.width, rect.height);
      }
    }
  } catch (err) {
    console.warn('Error rendering HTML to canvas:', err);
    // Canvas already has white background, just continue
  }

  return canvas;
}
