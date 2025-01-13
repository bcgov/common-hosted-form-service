import Vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';
import eslint from 'vite-plugin-eslint';
import vuetify from 'vite-plugin-vuetify';
import { defineConfig as vitestDefineConfig } from 'vitest/config';

const proxyObject = {
  target: 'http://localhost:8080',
  ws: true,
  changeOrigin: true,
};

// https://vitejs.dev/config/
// eslint-disable-next-line no-unused-vars
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: env.VITE_FRONTEND_BASEPATH ? env.VITE_FRONTEND_BASEPATH : '/app',
    server: {
      base: env.VITE_FRONTEND_BASEPATH ? env.VITE_FRONTEND_BASEPATH : '/app',
      proxy: {
        '^/pr-*/api': proxyObject,
        '^/pr-*/config': proxyObject,
        '^/app/api': proxyObject,
        '^/app/config': proxyObject,
      },
    },
    plugins: [Vue(), vuetify(), eslint()],
    resolve: {
      alias: {
        '~': resolve(__dirname, './src'),
        '~formiojs': resolve(__dirname, './node_modules/formiojs'),
        '~font-awesome': resolve(__dirname, './node_modules/font-awesome'),
        '~vuetify': resolve(__dirname, './node_modules/vuetify'),
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
        jsdom: {
          resources: 'usable',
        },
      },
      globals: true,
      environment: 'jsdom',
      deps: {
        inline: ['vuetify', 'i18n', 'vitest-canvas-mock'],
      },
    },
  };
});
