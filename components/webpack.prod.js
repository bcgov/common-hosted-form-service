const config = require('./webpack.config.js');
config.mode = 'production';
config.output.filename = 'chefs-form-viewer-components.min.js';
module.exports = config;
