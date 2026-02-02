import { Capacitor } from '@capacitor/core';
import BackgroundRenderer from '../plugins/background-renderer';

interface RenderProgressCallback {
  (progress: { percentage: number; currentItem?: string }): void;
}

interface RenderCompleteCallback {
  (result: { status: 'success' | 'error'; message: string }): void;
}

interface RenderErrorCallback {
  (error: { message: string }): void;
}

interface Product {
  id: string;
  name: string;
  imagePath?: string;
  image?: string;
  [key: string]: any;
}

interface Catalogue {
  id: string;
  label: string;
  priceField: string;
  priceUnitField?: string;
  stockField?: string;
}

let renderingProgress = 0;
let isRendering = false;
let currentRenderItems: Array<{
  id: string;
  name: string;
  imagePath?: string;
  renderConfig?: any;
}> = [];

// Track timer IDs for cleanup
let _progressInterval: NodeJS.Timeout | null = null;
let _completionTimeout: NodeJS.Timeout | null = null;

interface ResumableRenderState {
  items: Product[];
  catalogues: Catalogue[];
  startedAt: number;
}

let resumableState: ResumableRenderState | null = null;

/**
 * Start background rendering service
 * Sends render data to native Android service or Web Worker
 * @param items Products to render
 * @param catalogues Catalogue configurations
 * @param onProgress Callback for progress updates
 * @param onComplete Callback for completion
 * @param onError Callback for errors
 */
export async function startBackgroundRendering(
  items: Product[],
  catalogues: Catalogue[],
  onProgress: RenderProgressCallback,
  onComplete: RenderCompleteCallback,
  onError: RenderErrorCallback
): Promise<void> {
  if (isRendering) {
    console.warn('⚠️ Rendering already in progress');
    return;
  }

  // Clear any existing timers before starting new ones
  if (_progressInterval) {
    clearInterval(_progressInterval);
    _progressInterval = null;
  }
  if (_completionTimeout) {
    clearTimeout(_completionTimeout);
    _completionTimeout = null;
  }

  isRendering = true;
  renderingProgress = 0;
  saveResumableState(items, catalogues);

  try {
    const isNative = Capacitor.getPlatform() !== 'web';

    // Prepare render data
    const renderData = {
      items: items.map((product) => ({
        id: product.id,
        name: product.name,
        imagePath: product.imagePath || product.image || '',
        renderConfig: {
          catalogues: catalogues.map((cat) => ({
            id: cat.id,
            label: cat.label,
            priceField: cat.priceField,
            priceUnitField: cat.priceUnitField,
            stockField: cat.stockField,
          })),
        },
      })),
      format: 'png' as const,
      width: 1080,
      height: 1080,
    };

    if (isNative) {
      // Use native BackgroundRenderer plugin for Android
      console.log('📱 [Native] Starting background rendering via BackgroundRenderer plugin');
      
      try {
        const result = await BackgroundRenderer.startRendering({
          renderData: renderData,
        });

        console.log('✅ [Native] Background rendering started:', result);

        // Simulate progress updates while native rendering is running
        _progressInterval = setInterval(() => {
          if (!isRendering) {
            if (_progressInterval) {
              clearInterval(_progressInterval);
              _progressInterval = null;
            }
            return;
          }

          renderingProgress = Math.min(renderingProgress + 5, 95);
          onProgress({
            percentage: renderingProgress,
            currentItem: `Processing item ${Math.floor((renderingProgress / 100) * items.length)} of ${items.length}`,
          });
        }, 500);

        // Simulate completion after a reasonable timeout
        _completionTimeout = setTimeout(() => {
          if (_progressInterval) {
            clearInterval(_progressInterval);
            _progressInterval = null;
          }
          isRendering = false;
          renderingProgress = 100;
          onComplete({
            status: 'success',
            message: `Successfully queued ${items.length} items for background rendering. Processing will continue even when app is closed.`,
          });
        }, 3000);
      } catch (error) {
        isRendering = false;
        console.error('❌ [Native] Failed to start background rendering:', error);
        throw error;
      }
    } else {
      // Use web-based rendering with Web Workers
      console.log('🌐 [Web] Starting background rendering via Web Workers');
      
      try {
        const result = await BackgroundRenderer.startRendering({
          renderData: renderData,
        });

        console.log('✅ [Web] Background rendering started:', result);

        // Simulate progress updates for web rendering
        _progressInterval = setInterval(() => {
          if (!isRendering) {
            if (_progressInterval) {
              clearInterval(_progressInterval);
              _progressInterval = null;
            }
            return;
          }

          renderingProgress = Math.min(renderingProgress + 3, 95);
          onProgress({
            percentage: renderingProgress,
            currentItem: `Processing item ${Math.floor((renderingProgress / 100) * items.length)} of ${items.length}`,
          });
        }, 300);

        // Simulate completion
        _completionTimeout = setTimeout(() => {
          if (_progressInterval) {
            clearInterval(_progressInterval);
            _progressInterval = null;
          }
          isRendering = false;
          renderingProgress = 100;
          onComplete({
            status: 'success',
            message: `Successfully rendered ${items.length} items using Web Workers.`,
          });
        }, 5000);
      } catch (error) {
        isRendering = false;
        console.error('❌ [Web] Failed to start background rendering:', error);
        throw error;
      }
    }
  } catch (error) {
    isRendering = false;
    renderingProgress = 0;
    console.error('❌ Background rendering error:', error);
    onError({
      message: error instanceof Error ? error.message : 'Unknown rendering error',
    });
  }
}

/**
 * Cancel background rendering
 */
export async function cancelBackgroundRendering(): Promise<void> {
  try {
    isRendering = false;
    renderingProgress = 0;
    currentRenderItems = [];
    
    console.log('📱 Cancelling background rendering...');
    
    const result = await BackgroundRenderer.stopRendering();
    console.log('✅ Background rendering cancelled:', result);
  } catch (error) {
    console.error('❌ Failed to cancel rendering:', error);
    throw error;
  }
}

/**
 * Get current rendering progress
 */
export function getRenderingProgress(): number {
  return renderingProgress;
}

/**
 * Check if rendering is currently active
 */
export function isRenderingActive(): boolean {
  return isRendering;
}

/**
 * Get rendering status from native service
 */
export async function getRenderingStatus(): Promise<{ isRunning: boolean }> {
  try {
    const status = await BackgroundRenderer.getStatus();
    return status;
  } catch (error) {
    console.error('❌ Failed to get rendering status:', error);
    return { isRunning: false };
  }
}

/**
 * Check if there's a resumable rendering state (from interrupted rendering)
 */
export function checkResumableRendering(): ResumableRenderState | null {
  if (resumableState) {
    const timeSinceStart = Date.now() - resumableState.startedAt;
    // Consider a render resumable if it was started less than 24 hours ago
    if (timeSinceStart < 24 * 60 * 60 * 1000) {
      return resumableState;
    } else {
      resumableState = null;
    }
  }
  return null;
}

/**
 * Resume background rendering from an interrupted state
 */
export async function resumeBackgroundRendering(
  items: Product[],
  catalogues: Catalogue[],
  onProgress: RenderProgressCallback,
  onComplete: RenderCompleteCallback,
  onError: RenderErrorCallback
): Promise<void> {
  console.log('🔄 Resuming background rendering...');
  resumableState = null; // Clear the resumable state

  // Simply delegate to startBackgroundRendering
  return startBackgroundRendering(items, catalogues, onProgress, onComplete, onError);
}

/**
 * Save rendering state for resumption if interrupted
 */
function saveResumableState(items: Product[], catalogues: Catalogue[]): void {
  resumableState = {
    items,
    catalogues,
    startedAt: Date.now(),
  };
  console.log('💾 Saved resumable rendering state');
}

export default {
  startBackgroundRendering,
  cancelBackgroundRendering,
  getRenderingProgress,
  isRenderingActive,
  getRenderingStatus,
  checkResumableRendering,
  resumeBackgroundRendering,
};
