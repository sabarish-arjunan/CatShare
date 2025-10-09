import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.venuskids.catalogue',
  appName: 'Catalogue Manager',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    StatusBar: {
      overlay: true, // Draw webview edge-to-edge (content can extend to the top)
    },
  },
};

export default config;
