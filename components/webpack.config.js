const path = require('node:path');

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['css-loader'],
      },
    ],
  },
  entry: path.join(path.resolve(__dirname, 'lib'), 'index.js'),
  output: {
    library: 'ChefsFormViewerComponents',
    libraryTarget: 'umd',
    libraryExport: 'default',
    path: path.resolve(__dirname, 'dist'),
    filename: 'chefs-form-viewer-components.js',
  },
  mode: 'development',
  performance: { hints: false },
  externals: {
    formiojs: 'Formio',
  },
};
