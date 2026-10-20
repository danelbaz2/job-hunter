import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In docker compose the API runs at http://api:8000; locally at http://localhost:8000.
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    proxy: {
      // Same origin in dev, so cookies and CORS behave like production behind one domain.
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
})
