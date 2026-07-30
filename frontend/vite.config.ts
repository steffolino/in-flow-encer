import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// API_PROXY_TARGET lets Docker Compose point the dev-server proxy at the
// `backend` service name, while local (non-container) dev keeps localhost.
const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
