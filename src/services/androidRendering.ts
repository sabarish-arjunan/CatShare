import { registerPlugin } from '@capacitor/core';
import type { Plugin, PluginListenerHandle } from '@capacitor/core';

/**
 * Android Rendering Plugin Interface
 * Provides methods to interact with native Kotlin rendering services
 */
interface CatalogueRenderPlugin extends Plugin {
  /**
   * Render a single product image
   */
  render(options: {
    html: string;
    fileName: string;
    folderName?: string;
  }): Promise<void>;

  /**
   * Render multiple products in batch
   */
  renderBatch(options: {
    renderJobs: Array<{
      html: string;
      fileName: string;
    }>;
    folderName?: string;
  }): Promise<{ jobCount: number; message: string }>;

  /**
   * Start background rendering service
   */
  startBackgroundRendering(): Promise<void>;

  /**
   * Cancel all pending render jobs
   */
  cancelRenders(): Promise<void>;
}

const CatalogueRender = registerPlugin<CatalogueRenderPlugin>('CatalogueRender');

export interface RenderJobOptions {
  html: string;
  fileName: string;
  folderName?: string;
}

export interface BatchRenderOptions {
  renderJobs: RenderJobOptions[];
  folderName?: string;
}

/**
 * Wrapper service for Android rendering
 * Provides a TypeScript-friendly interface to the Kotlin rendering service
 */
export const AndroidRenderingService = {
  /**
   * Render a single product image
   * @param html The HTML content to render
   * @param fileName The output filename (e.g., "product_123_Master.png")
   * @param folderName Optional folder name (defaults to catalogue label)
   */
  async renderImage(
    html: string,
    fileName: string,
    folderName?: string
  ): Promise<void> {
    try {
      console.log(`📱 [Android] Rendering image: ${fileName}`);
      await CatalogueRender.render({
        html,
        fileName,
        folderName: folderName || 'renders',
      });
    } catch (error) {
      console.error('[Android] Rendering failed:', error);
      throw error;
    }
  },

  /**
   * Render multiple product images in batch
   * Useful for bulk rendering operations
   * @param jobs Array of render jobs
   * @param folderName Optional folder name
   */
  async renderBatch(
    jobs: Array<{ html: string; fileName: string }>,
    folderName?: string
  ): Promise<{ jobCount: number }> {
    try {
      console.log(`📱 [Android] Rendering ${jobs.length} images in batch`);
      const result = await CatalogueRender.renderBatch({
        renderJobs: jobs,
        folderName: folderName || 'renders',
      });
      console.log(`✅ [Android] Batch render result:`, result);
      return { jobCount: result.jobCount };
    } catch (error) {
      console.error('[Android] Batch rendering failed:', error);
      throw error;
    }
  },

  /**
   * Start background rendering service
   * This will continue rendering even when the app is closed
   */
  async startBackgroundRendering(): Promise<void> {
    try {
      console.log('📱 [Android] Starting background rendering service');
      await CatalogueRender.startBackgroundRendering();
      console.log('✅ [Android] Background rendering service started');
    } catch (error) {
      console.error('[Android] Failed to start background rendering:', error);
      throw error;
    }
  },

  /**
   * Cancel all pending render jobs
   */
  async cancelAllRenders(): Promise<void> {
    try {
      console.log('📱 [Android] Cancelling all render jobs');
      await CatalogueRender.cancelRenders();
      console.log('✅ [Android] All render jobs cancelled');
    } catch (error) {
      console.error('[Android] Failed to cancel renders:', error);
      throw error;
    }
  },

  /**
   * Helper function to save pending render jobs for background rendering
   * This should be called before app closes to ensure rendering continues
   */
  savePendingRenderJobs(
    jobs: Array<{ html: string; fileName: string }>
  ): void {
    try {
      const sharedPref = window.localStorage.getItem('android_pending_jobs');
      if (jobs.length === 0) {
        window.localStorage.removeItem('android_pending_jobs');
      } else {
        window.localStorage.setItem(
          'android_pending_jobs',
          JSON.stringify(jobs)
        );
      }
      console.log(
        `💾 [Android] Saved ${jobs.length} pending render jobs for background rendering`
      );
    } catch (error) {
      console.error('[Android] Failed to save pending jobs:', error);
    }
  },

  /**
   * Get stored pending render jobs
   */
  getPendingRenderJobs(): Array<{ html: string; fileName: string }> {
    try {
      const jobs = window.localStorage.getItem('android_pending_jobs');
      return jobs ? JSON.parse(jobs) : [];
    } catch (error) {
      console.error('[Android] Failed to get pending jobs:', error);
      return [];
    }
  },

  /**
   * Clear pending render jobs
   */
  clearPendingRenderJobs(): void {
    try {
      window.localStorage.removeItem('android_pending_jobs');
      console.log('💾 [Android] Cleared pending render jobs');
    } catch (error) {
      console.error('[Android] Failed to clear pending jobs:', error);
    }
  },
};

export default AndroidRenderingService;
