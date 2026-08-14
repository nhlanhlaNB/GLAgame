import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/deepseek/explain': {
        target: 'http://localhost:8888',
        rewrite: (path) => path.replace(/^\/api\/deepseek\/explain/, '/.netlify/functions/deepseek-explain')
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        game: resolve(__dirname, 'game/index.html'),
      },
    },
  },
})
