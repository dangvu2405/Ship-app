/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Variables are imported in main.scss
        // No additionalData needed to avoid duplicate imports
        silenceDeprecations: ['import'], // Suppress @import deprecation warnings
      },
    },
  },
  server: {
    watch: {
      usePolling: true,
    },
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: Number(process.env.PORT) || 3000,
    host: true, // Listen on all addresses (0.0.0.0)
    allowedHosts: ["ship-app-sghq.onrender.com"],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
