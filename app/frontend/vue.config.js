import.meta.env.VITE_VERSION = require('./package.json').version;

const proxyObject = {
  target: 'http://localhost:8080',
  ws: true,
  changeOrigin: true
};

module.exports = {
  publicPath: import.meta.env.VITE_FRONTEND_BASEPATH ? import.meta.env.VITE_FRONTEND_BASEPATH : '/app',
  'transpileDependencies': [
    'vuetify'
  ],
  devServer: {
    compress: true,
    proxy: {
      '/api': proxyObject,
      '/config': proxyObject
    }
  }
};
