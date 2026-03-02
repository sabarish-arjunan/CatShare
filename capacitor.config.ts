import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.catshare.official',
  appName: 'CatShare',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_launcher_foreground',
      iconColor: '#3b82f6',
      sound: 'notification',
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    StatusBar: {
      overlay: false,
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      showSpinner: false,
      iosSpinnerStyle: 'small',
      androidSpinnerStyle: 'large',
      spinnerColor: '#3b82f6',
    },
    FirebaseAnalytics: {
      // No extra config needed here, it reads from google-services.json
    },
  },
};

export default config;
