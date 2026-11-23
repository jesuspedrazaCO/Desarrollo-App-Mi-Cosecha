import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt': cuando hay una versión nueva, la app avisa y la persona decide cuándo actualizar
      // (así no se recarga sola en medio de un formulario).
      registerType: 'prompt',
      includeAssets: ['logo-micosecha.png', 'scooby.jpeg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'AgroFinanzas',
        short_name: 'AgroFinanzas',
        description: 'Gestión financiera y agrícola para tu finca',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a1c10',
        theme_color: '#0a1c10',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Los mapas y el PDF pesan: se sube el límite para que la app completa quede guardada
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // Cualquier pantalla de la app (/crops, /gastos...) abre sin internet
        navigateFallback: '/index.html',
        // La API y las imágenes subidas NUNCA se sirven desde la caché del service worker
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Tipografías de Google: se guardan para que la app se vea igual sin internet
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})