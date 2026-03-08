import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Oil Markets',
        short_name: 'OilMkts',
        description: 'Polymarket crude oil prediction markets + WTI spot price',
        theme_color: '#0a0f1e',
        background_color: '#0a0f1e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/gamma-api\.polymarket\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'polymarket-api', expiration: { maxAgeSeconds: 120 } }
          },
          {
            urlPattern: /^https:\/\/api\.eia\.gov\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'eia-api', expiration: { maxAgeSeconds: 3600 } }
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/gamma-api': {
        target: 'https://gamma-api.polymarket.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gamma-api/, ''),
      },
      '/kalshi-api': {
        target: 'https://api.elections.kalshi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kalshi-api/, ''),
      },
    },
  },
})
