import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.venuskids.catalogue',
  appName: 'Catalogue Manager',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    StatusBar: {
      overlay: false, // ✅ Ensures content is below the status bar
    },
  },
};

export default config;