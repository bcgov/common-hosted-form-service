process.env.VUE_APP_VERSION = require('./package.json').version;

const proxyTarget = 'http://localhost:8080';

module.exports = {
  publicPath: process.env.FRONTEND_BASEPATH ? process.env.FRONTEND_BASEPATH : '/app',
  'transpileDependencies': [
    'vuetify'
  ],
  devServer: {
    proxy: {
      '/api': {
        target: proxyTarget,
        ws: true,
        changeOrigin: true
      },
      '/config': {
        target: proxyTarget,
        pathRewrite: {'^/app' : ''}
      }
    }
  }
};
