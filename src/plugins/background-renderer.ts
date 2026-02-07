// src/plugins/background-renderer.ts
// TypeScript interface for the Background Renderer plugin

import { registerPlugin } from '@capacitor/core';

export interface BackgroundRendererPlugin {
  /**
   * Start background rendering
   * @param options - Rendering configuration
   */
  startRendering(options: {
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
  }): Promise<{ success: boolean; message: string }>;

  /**
   * Stop background rendering
   */
  stopRendering(): Promise<{ success: boolean; message: string }>;

  /**
   * Get rendering status
   */
  getStatus(): Promise<{ isRunning: boolean }>;
}

const BackgroundRenderer = registerPlugin<BackgroundRendererPlugin>('BackgroundRenderer', {
  web: () => import('./web').then(m => new m.BackgroundRendererWeb()),
});

export default BackgroundRenderer;
