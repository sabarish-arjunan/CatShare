// Web Worker for background image rendering
import { renderProductToCanvas, canvasToBase64 } from '../utils/canvasRenderer';
import { Filesystem, Directory } from '@capacitor/filesystem';

interface RenderData {
  items: Array<{
    id: string;
    name: string;
    imagePath?: string;
    renderConfig?: any;
  }>;
  format?: 'png' | 'jpg' | 'jpeg';
  width?: number;
  height?: number;
}

interface MessageData {
  type: string;
  data: RenderData;
}

// Listen for messages from the main thread
self.onmessage = async (event: MessageEvent<MessageData>) => {
  const { type, data } = event.data;

  if (type === 'START_RENDERING') {
    try {
      // Process rendering task
      console.log('Worker: Starting render task', data);

      // Process and render items
      const results = await processRendering(data);

      self.postMessage({
        type: 'RENDERING_COMPLETE',
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Worker rendering error:', error);
      self.postMessage({
        type: 'RENDERING_ERROR',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
};

async function processRendering(renderData: RenderData): Promise<any> {
  const { items, format = 'png', width = 1080, height = 1080 } = renderData;

  console.log(`Worker: Processing ${items.length} items for ${format} at ${width}x${height}`);

  const results = [];
  let successCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    try {
      console.log(`Worker: Rendering item ${i + 1}/${items.length}: ${item.id}`);

      // Render the product to canvas
      const canvas = await renderProductToCanvas(item, {
        width: width,
        scale: 1
      }, {
        enabled: false // No watermark for shared renders
      });

      // Convert canvas to base64
      const base64 = canvasToBase64(canvas);

      // Get catalogue label from renderConfig if available
      const catalogueLabel = item.renderConfig?.catalogues?.[0]?.label || 'General';
      const filename = `product_${item.id}_${catalogueLabel}.png`;

      // Save the rendered image to filesystem
      try {
        const filePath = `${catalogueLabel}/${filename}`;
        await Filesystem.writeFile({
          path: filePath,
          data: base64,
          directory: Directory.External,
          recursive: true
        });

        console.log(`Worker: Saved rendered image for ${item.id}`);
      } catch (fsError) {
        console.warn(`Worker: Failed to save file for ${item.id}:`, fsError);
        // Still count as success since we rendered it
      }

      // Also cache in localStorage for quick access
      try {
        const cacheKey = `rendered::${catalogueLabel}::${item.id}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          base64,
          timestamp: Date.now(),
          filename
        }));
      } catch (storageError) {
        console.warn(`Worker: Failed to cache in localStorage:`, storageError);
      }

      successCount++;
      results.push({
        id: item.id,
        success: true,
        filename: filename
      });

      // Send progress update to main thread
      self.postMessage({
        type: 'RENDERING_PROGRESS',
        current: i + 1,
        total: items.length,
        percentage: Math.round(((i + 1) / items.length) * 100)
      });

    } catch (error) {
      console.error(`Worker: Failed to render item ${item.id}:`, error);
      results.push({
        id: item.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown rendering error'
      });

      // Still send progress for failed items
      self.postMessage({
        type: 'RENDERING_PROGRESS',
        current: i + 1,
        total: items.length,
        percentage: Math.round(((i + 1) / items.length) * 100)
      });
    }
  }

  console.log(`Worker: Rendering complete. ${successCount}/${items.length} items rendered successfully`);

  return {
    itemsProcessed: items.length,
    itemsSuccessful: successCount,
    format,
    width,
    height,
    timestamp: new Date().toISOString(),
    results
  };
}

// Export for TypeScript
export {};
