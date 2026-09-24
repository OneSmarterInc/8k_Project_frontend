import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // FE-002: in development, forward /api/* to the Django backend.
  // The browser only talks to the Vite server (same origin), so no
  // hardcoded backend URL and no CORS setup is needed for local dev.
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})