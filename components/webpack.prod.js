const config = require('./webpack.config.js');
config.mode = 'production';
config.output.filename = 'bcgov-formio-components.min.js';
config.devtool = false; // Disable source maps in production
module.exports = config;
