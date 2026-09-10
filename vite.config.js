import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/Construction_building/' : '/',
  root: '.',
  publicDir: 'app/public',
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          reactVendor: ['react', 'react-dom', 'react-router-dom'],
          animVendor: ['gsap', 'lenis', 'lucide-react'],
        },
      },
    },
  },
  server: {
    host: true, // Exposes Network IP link for testing on mobile devices & tablets
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/videos': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/frames': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
});
