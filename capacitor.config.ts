import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.venuskids.catalogue',
  appName: 'Catalogue Manager',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    StatusBar: {
      overlay: false, // Keep webview below the status bar (not edge-to-edge)
    },
  },
};

export default config;
