import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5178,
    strictPort: true,
    host: '127.0.0.1',
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          echarts: ['echarts'],
          codemirror: [
            '@uiw/react-codemirror',
            '@codemirror/lang-python',
            '@codemirror/theme-one-dark',
          ],
          react: ['react', 'react-dom', 'react-router-dom', 'zustand'],
        },
      },
    },
  },
});
