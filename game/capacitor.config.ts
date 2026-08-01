import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ru.kryukovo.mayak',
  appName: 'Маяк в ноябре',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  androidScheme: 'https',
  backgroundColor: '#0b1216',
};

export default config;
