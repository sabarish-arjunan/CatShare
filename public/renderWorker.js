// renderWorker.js - Web Worker for handling PNG rendering off the main thread
// This allows the UI to remain responsive while rendering happens in the background

import html2canvas from 'html2canvas-pro';

let isRendering = false;

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

      // Render the HTML to canvas
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.opacity = '0';
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
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
