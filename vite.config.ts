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
        "name": "My Ionic App",
        "short_name": "Ionic App",
        "start_url": ".",
        "display": "standalone",
        "background_color": "#ffffff",
        "theme_color": "#ffffff",
        "icons": [
          {
            "src": "assets/icon/favicon.png",
            "sizes": "64x64 32x32 24x24 16x16",
            "type": "image/x-icon"
          },
          {
            "src": "assets/icon/icon.png",
            "type": "image/png",
            "sizes": "512x512",
            "purpose": "maskable"
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
