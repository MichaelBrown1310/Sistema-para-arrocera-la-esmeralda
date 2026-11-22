import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.brujula.tripleimpacto',
  appName: 'Brújula Triple Impacto',
  webDir: 'dist',
  // Permite que la app instalada hable con un servidor http:// de la red local (desarrollo).
  // En producción el servidor debería usar https://.
  server: { androidScheme: 'https', cleartext: true },
  plugins: {
    CapacitorHttp: { enabled: true }, // las llamadas al servidor salen por la capa nativa
    LocalNotifications: { iconColor: '#2f7d4f' },
  },
};

export default config;
