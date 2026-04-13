import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  // Đồng bộ VITE_API_ORIGIN với APP_URL backend (chỉ origin, không /api). VITE_PROXY_TARGET = alias cũ.
  const proxyTarget =
    env.VITE_API_ORIGIN?.trim() ||
    env.VITE_PROXY_TARGET?.trim() ||
    'http://localhost:8080'

  return {
  plugins: [react()],
  /**
   * Pre-bundle các dep dùng chung (antd/dayjs/refine) để giảm 504 "Outdated Optimize Dep"
   * khi trình duyệt còn URL cũ trong lúc Vite tái tạo `.vite/deps`.
   */
  optimizeDeps: {
    include: [
      '@lottiefiles/dotlottie-react',
      '@lottiefiles/dotlottie-web',
      'dayjs',
      'dayjs/locale/vi',
      '@ant-design/icons',
      'antd',
      '@ant-design/cssinjs',
      '@refinedev/core',
      '@refinedev/antd',
      '@refinedev/react-router-v6',
      'react-router-dom',
      '@tanstack/react-query',
    ],
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
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
      // Polling = nhiều invalidation → dễ lệch optimize cache; chỉ bật khi cần (Docker/WSL).
      usePolling: process.env.VITE_WATCH_POLLING === 'true',
    },
    port: 3000,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: Number(process.env.PORT) || 3000,
    host: true, // Listen on all addresses (0.0.0.0)
    allowedHosts: ["ship-app-sghq.onrender.com"],
  },
  }
})
