const path = require('path');
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import eslintPlugin from 'vite-plugin-eslint';

const proxyObject = {
  target: 'http://localhost:8080',
  ws: true,
  changeOrigin: true,
};

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_FRONTEND_BASEPATH
    ? process.env.VITE_FRONTEND_BASEPATH
    : '/app',
  server: {
    proxy: {
      '^/pr-*/api': proxyObject,
      '^/pr-*/config': proxyObject,
      '/app/api': proxyObject,
      '/app/config': proxyObject,
    },
  },
  plugins: [vue(), eslintPlugin()],
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['material-design-icons-iconfont'],
  },
});
