import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/lottie-proxy': {
        target: 'https://cf-assets.www.cloudflare.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lottie-proxy/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
