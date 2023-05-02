const path = require('path');
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import eslintPlugin from 'vite-plugin-eslint';

const proxyObject = {
  target: 'http://localhost:8080',
  ws: true,
  changeOrigin: true,
};

export default defineConfig({
  server: {
    proxy: {
      '/api': proxyObject,
      '/config': proxyObject,
    },
  },
  plugins: [vue(), eslintPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
