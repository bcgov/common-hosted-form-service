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
      '@': path.resolve(__dirname, './src'),
      '@font-awesome': path.resolve(__dirname, './node_modules/font-awesome'),
      '@formiojs': path.resolve(__dirname, './node_modules/formiojs'),
      '@vuetify': path.resolve(__dirname, './node_modules/vuetify'),
    },
  },
});
