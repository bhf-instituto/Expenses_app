import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:5173'

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'pwa-192.svg', 'pwa-512.svg'],
        manifest: {
          name: 'Expenses Mobile',
          short_name: 'Expenses',
          description: 'Registro rapido de gastos con soporte offline para mobile.',
          theme_color: '#1e2a39',
          background_color: '#f6f4eb',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: '/pwa-192.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
            },
            {
              src: '/pwa-512.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
            },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'document',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'html-cache',
                networkTimeoutSeconds: 3,
              },
            },
            {
              urlPattern: ({ request }) =>
                ['style', 'script', 'worker', 'font'].includes(request.destination),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'assets-cache',
              },
            },
          ],
        },
      }),
    ],
    server: {
      proxy: {
        // API routes. Keep /sets proxy strict so SPA routes like
        // /sets/:id/categories/fijo are served by Vite (index.html) on refresh.
        '^/auth(?:/.*)?(?:\\?.*)?$': {
          target: backendUrl,
          changeOrigin: true,
        },
        '^/health(?:/.*)?(?:\\?.*)?$': {
          target: backendUrl,
          changeOrigin: true,
        },
        '^/invite(?:/.*)?(?:\\?.*)?$': {
          target: backendUrl,
          changeOrigin: true,
        },
        '^/sets(?:\\?.*)?$': {
          target: backendUrl,
          changeOrigin: true,
        },
        '^/sets/\\d+(?:\\?.*)?$': {
          target: backendUrl,
          changeOrigin: true,
        },
        '^/sets/\\d+/(users|categories|expenses)(?:\\?.*)?$': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
