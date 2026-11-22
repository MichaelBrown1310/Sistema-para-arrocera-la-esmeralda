import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`       -> carpeta dist/: PWA instalable + base para Capacitor (Android / iOS)
// `npm run build:demo`  -> un solo index.html autocontenido (para compartir la demo, sin PWA)
export default defineConfig(({ mode }) => {
  if (mode === 'demo') {
    return { plugins: [react(), viteSingleFile()], build: { outDir: 'dist-demo' } };
  }
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate', // la app se actualiza sola cuando se publica una versión nueva
        injectRegister: 'auto',
        includeAssets: ['favicon.png', 'apple-touch-icon.png'],
        manifest: {
          name: 'Brújula Triple Impacto',
          short_name: 'Brújula',
          description: 'Decisiones con riesgo y sostenibilidad para Arroz Blanquita',
          lang: 'es-CO',
          theme_color: '#2f7d4f',
          background_color: '#f3f5f2',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '.',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // guarda todos los archivos de la app para que abra sin internet
          globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          // guarda también los pedazos de mapa ya vistos, para verlos sin señal
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'mapa-osm',
                expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }),
    ],
    build: { outDir: 'dist' },
  };
});
