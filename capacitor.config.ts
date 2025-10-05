import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.venuskids.catalogue',
  appName: 'Catalogue Manager',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    StatusBar: {
      overlay: true, // Keep webview under the status bar (edge-to-edge)
    },
  },
};

export default config;
