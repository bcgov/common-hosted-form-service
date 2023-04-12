process.env.VUE_APP_VERSION = require('./package.json').version;

const proxyObject = {
  target: 'http://localhost:8080',
  ws: true,
  changeOrigin: true,
};

module.exports = {
  publicPath: process.env.VUE_APP_FRONTEND_BASEPATH ? process.env.VUE_APP_FRONTEND_BASEPATH : '/app',
  transpileDependencies: ['vuetify'],
  devServer: {
    compress: true,
    proxy: {
      '/api': proxyObject,
      '/config': proxyObject,
    },
  },
};
