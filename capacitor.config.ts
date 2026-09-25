import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.coboai.mobile',
  appName: 'Cobo AI',
  webDir: 'dist',
  server: { androidScheme: 'https' }
};

export default config;
