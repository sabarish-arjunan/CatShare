// src/plugins/web.ts
// Web implementation (fallback for browser)

import { WebPlugin } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import type { BackgroundRendererPlugin } from './background-renderer';

let activeWorker: Worker | null = null;

export class BackgroundRendererWeb extends WebPlugin implements BackgroundRendererPlugin {
  async startRendering(options: {
    renderData: {
      items: Array<{
        id: string;
        name: string;
        imagePath?: string;
        renderConfig?: any;
      }>;
      format?: 'png' | 'jpg' | 'jpeg';
      width?: number;
      height?: number;
    };
  }): Promise<{ success: boolean; message: string }> {
    console.log('🌐 [Web] Starting web-based rendering (using Web Workers)');

    // Stop any existing worker
    if (activeWorker) {
      activeWorker.terminate();
      activeWorker = null;
    }

    // Use Web Workers for background processing in browser
    const worker = new Worker(new URL('../workers/rendering-worker.ts', import.meta.url), {
      type: 'module'
    });

    activeWorker = worker;

    // Set up message handler to forward progress and completion events
    worker.onmessage = async (event) => {
      const { type, current, total, percentage, success, data, error } = event.data;

      if (type === 'RENDERING_PROGRESS') {
        // Forward progress to main thread via window event
        window.dispatchEvent(new CustomEvent('renderProgress', {
          detail: {
            percentage: percentage || 0,
            current: current || 0,
            total: total || 0
          }
        }));
      } else if (type === 'RENDERING_COMPLETE') {
        console.log('✅ [Web] Worker rendering complete, saving files to filesystem...');

        try {
          // Save all rendered images to filesystem
          if (data && data.results) {
            for (const result of data.results) {
              if (result.success && result.base64) {
                try {
                  const filePath = `${result.catalogueLabel}/${result.filename}`;
                  await Filesystem.writeFile({
                    path: filePath,
                    data: result.base64,
                    directory: Directory.External,
                    recursive: true
                  });
                  console.log(`✅ [Web] Saved rendered image to ${filePath}`);
                } catch (fsError) {
                  console.warn(`⚠️ [Web] Failed to save file for ${result.id}:`, fsError);
                }
              }
            }

            // Also cache results in localStorage
            for (const result of data.results) {
              if (result.success && result.base64) {
                try {
                  const cacheKey = `rendered::${result.catalogueLabel}::${result.id}`;
                  localStorage.setItem(cacheKey, JSON.stringify({
                    base64: result.base64,
                    timestamp: Date.now(),
                    filename: result.filename
                  }));
                } catch (storageError) {
                  console.warn(`⚠️ [Web] Failed to cache in localStorage:`, storageError);
                }
              }
            }
          }

          // Dispatch completion event
          window.dispatchEvent(new CustomEvent('renderComplete', {
            detail: { status: 'success', message: 'Rendering completed' }
          }));
        } catch (error) {
          console.error('❌ [Web] Failed to save rendered images:', error);
          window.dispatchEvent(new CustomEvent('renderComplete', {
            detail: { status: 'error', message: 'Failed to save rendered images' }
          }));
        }

        activeWorker = null;
      } else if (type === 'RENDERING_ERROR') {
        console.error('❌ [Web] Worker rendering error:', error);
        // Dispatch error event
        window.dispatchEvent(new CustomEvent('renderComplete', {
          detail: { status: 'error', message: error }
        }));
        activeWorker = null;
      }
    };

    worker.onerror = (error) => {
      console.error('❌ [Web] Worker error:', error);
      window.dispatchEvent(new CustomEvent('renderComplete', {
        detail: { status: 'error', message: error.message }
      }));
      activeWorker = null;
    };

    // Start rendering in the worker
    worker.postMessage({
      type: 'START_RENDERING',
      data: options.renderData
    });

    return {
      success: true,
      message: 'Web rendering started with Web Workers'
    };
  }

  async stopRendering(): Promise<{ success: boolean; message: string }> {
    console.log('🛑 Stopping web rendering');
    if (activeWorker) {
      activeWorker.terminate();
      activeWorker = null;
    }
    return {
      success: true,
      message: 'Web rendering stopped'
    };
  }

  async getStatus(): Promise<{ isRunning: boolean }> {
    return { isRunning: activeWorker !== null };
  }
}
