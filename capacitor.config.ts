import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.venuskids.catalogue',
  appName: 'Catalogue Manager',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    StatusBar: {
      overlay: false, // Do not draw under the status bar; system reserves inset
    },
  },
};

export default config;
