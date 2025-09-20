/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        "name": "BarangayMed",
        "short_name": "BarangayMed",
        "start_url": ".",
        "display": "standalone",
        "background_color": "#ffffff",
        "theme_color": "#4CAF50",
        "description": "Get access to medicine, consultations, and announcements all in one app!",
        "icons": [
          {
            "src": "assets/icon.png",
            "sizes": "64x64 32x32 24x24 16x16",
            "type": "image/png"
          },
          {
            "src": "assets/icon.png",
            "type": "image/png",
            "sizes": "512x512",
            "purpose": "maskable"
          },
          {
            "src": "assets/icon.svg",
            "type": "image/svg+xml",
            "sizes": "192x192",
            "purpose": "any"
          },
          {
            "src": "assets/icon.svg",
            "type": "image/svg+xml",
            "sizes": "512x512",
            "purpose": "any"
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
      }
    }),
    legacy(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
