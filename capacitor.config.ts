import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.taqueriamexicolindo.comanda',
  appName: 'COMANDA',
  webDir: 'out',
  server: {
    url: 'https://comanda-app-beta.vercel.app',
    cleartext: false
  }
};

export default config;
