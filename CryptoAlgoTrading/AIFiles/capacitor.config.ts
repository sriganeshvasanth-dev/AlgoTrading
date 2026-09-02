import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.crypto.scanner',
  appName: 'Algo Trading',
  webDir: 'dist/CryptoCurrencyScanner/browser',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowInsecure: ['api.india.delta.exchange']
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#667eea'
    }
  }
};

export default config;
