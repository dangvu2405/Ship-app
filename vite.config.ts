import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const proxyTarget = env.VITE_API_ORIGIN?.trim() || 'http://localhost:8080'
  const apiPrefix = env.VITE_API_BASE_URL?.trim() || '/api'
  const normalizedApiPrefix = apiPrefix.startsWith('/') ? apiPrefix : `/${apiPrefix}`
  const proxyConfig = {
    [normalizedApiPrefix]: {
      target: proxyTarget,
      changeOrigin: true,
      secure: false,
    },
    '/sanctum': {
      target: proxyTarget,
      changeOrigin: true,
      secure: false,
    },
    '/health': {
      target: proxyTarget,
      changeOrigin: true,
      secure: false,
    },
    '/up': {
      target: proxyTarget,
      changeOrigin: true,
      secure: false,
    },
    '/vpic': {
      target: 'https://vpic.nhtsa.dot.gov',
      changeOrigin: true,
      rewrite: (p: string) => p.replace(/^\/vpic/, ''),
    },
  }

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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('recharts')) return 'charts-vendor';
          if (id.includes('@ant-design') || id.includes('/antd/')) return 'antd-vendor';
          if (id.includes('@refinedev')) return 'refine-vendor';
          if (id.includes('@tanstack/react-query')) return 'query-vendor';
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'react-vendor';
          return;
        },
      },
    },
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
      usePolling: process.env.VITE_WATCH_POLLING === 'true',
    },
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: 'all',
    proxy: proxyConfig,
  },
  preview: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: 'all',
    proxy: proxyConfig,
  },
  }
})
