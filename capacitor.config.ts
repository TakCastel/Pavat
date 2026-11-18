import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pavat.app',
  appName: 'Pavat',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#202939',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#64748b'
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#f8fafc'
    }
  }
};

export default config;
