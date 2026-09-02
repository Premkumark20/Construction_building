import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: '.',
  base: './',
  publicDir: 'app/public',
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Exposes Network IP link for testing on mobile devices & tablets
    port: 5173,
    strictPort: true,
    watch: {
      ignored: [
        '**/uploads/**',
        '**/app/server/**',
        '**/frames/**',
        '**/*.db',
        '**/*.db-journal',
        '**/*.sqlite',
        '**/*.sqlite-journal',
      ],
    },
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
