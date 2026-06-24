import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,json,bin}'
        ],
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50MB
        skipWaiting: true,
        clientsClaim: true
      },
      manifest: {
        name: 'RootFacts - AI Plant/Root Recognition',
        short_name: 'RootFacts',
        description: 'Aplikasi AI untuk mengenali tanaman dan akar serta memberikan fakta menarik',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: '/screenshots/screenshot1.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Home screen with camera preview'
          },
          {
            src: '/screenshots/screenshot2.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Detection result with fun fact info'
          }
        ]
      }
    })
  ],

  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'tensorflow': ['@tensorflow/tfjs', '@tensorflow/tfjs-backend-webgpu'],
          'transformers': ['@huggingface/transformers']
        }
      }
    }
  },
  server: {
    port: 3001,
    host: true
  }
});

