const path = require('path');

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
    library: 'BcGovFormioComponents',
    libraryTarget: 'umd',
    libraryExport: 'default',
    path: path.resolve(__dirname, 'dist'),
    filename: 'bcgov-formio-components.js',
  },
  mode: 'development',
  devtool: false, // Disable source maps to prevent webpack:// protocol errors
  performance: { hints: false },
  externals: {
    formiojs: 'Formio',
  },
  plugins: [
    // Strip source map references from bundled libraries
    {
      apply: (compiler) => {
        compiler.hooks.emit.tap('StripSourceMaps', (compilation) => {
          Object.keys(compilation.assets).forEach((filename) => {
            if (filename.endsWith('.js')) {
              let source = compilation.assets[filename].source();
              // Remove source map references
              source = source.replace(/\/\/# sourceMappingURL=.*\.map/g, '');
              compilation.assets[filename] = {
                source: () => source,
                size: () => source.length,
              };
            }
          });
        });
      },
    },
  ],
};
