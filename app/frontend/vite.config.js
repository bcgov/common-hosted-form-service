import { resolve } from 'path';
import { defineConfig } from 'vite';
import Vue from '@vitejs/plugin-vue';
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
    base: process.env.VITE_FRONTEND_BASEPATH
      ? process.env.VITE_FRONTEND_BASEPATH
      : '/app',
    proxy: {
      '^/pr-*/api': proxyObject,
      '^/pr-*/config': proxyObject,
      '/app/api': proxyObject,
      '/app/config': proxyObject,
    },
  },
  plugins: [Vue(), vuetify({ autoImport: true }), eslintPlugin()],
  resolve: {
    alias: {
      '~': resolve(__dirname, './src'),
      '~formiojs': resolve(__dirname, './node_modules/formiojs'),
      '~font-awesome': resolve(__dirname, './node_modules/font-awesome'),
      '~vuetify': resolve(__dirname, './node_modules/vuetify'),
      // no clue why crypto is required, but unit tests will not run without it
      crypto: 'crypto-js',
    },
  },
  test: {
    mockReset: true,
    clearMocks: true,
    coverage: {
      enabled: true,
      include: [
        'src/**/*.{js,vue}',
        '!src/main.js',
        '!src/formio/**/*.*',
        '!src/plugins/*.*',
      ],
      extension: ['.js', '.json', '.vue', '.jsx'],
    },
    setupFiles: [
      './tests/unit/vuetify.config.js',
      './tests/unit/i18n.config.js',
      './tests/unit/setup.js',
    ],
    include: [
      '**/tests/unit/**/*.spec.(js|jsx|ts|tsx)|**/__tests__/*.(js|jsx|ts|tsx)',
    ],
    environmentOptions: {
      url: 'http://localhost/',
    },
    globals: true,
    environment: 'jsdom',
    deps: {
      inline: ['vuetify', 'i18n'],
    },
  },
});
