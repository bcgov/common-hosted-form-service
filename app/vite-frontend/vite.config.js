import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import eslintPlugin from 'vite-plugin-eslint';
import vuetify from 'vite-plugin-vuetify';

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
  plugins: [vue(), vuetify({ autoImport: true }), eslintPlugin()],
  resolve: {
    alias: {
      '~': resolve(__dirname, './src'),
    },
  },
});
