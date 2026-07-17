import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.panchalnihar.fairshare',
  appName: 'FairShare',
  webDir: 'dist/fair-share/browser',
  server: {
    androidScheme: 'http'
  }
};

export default config;
