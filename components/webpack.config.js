const path = require('path');

module.exports = {
  entry: path.join(path.resolve(__dirname, 'lib'), 'index.js'),
  output: {
    library: 'BcGovFormioComponents',
    libraryTarget: 'umd',
    libraryExport: 'default',
    path: path.resolve(__dirname, 'dist'),
    filename: 'bcgov-formio-components.js',
  },
  mode: 'development',
  performance: { hints: false },
  externals: {
    formiojs: 'Formio'
  }
};
