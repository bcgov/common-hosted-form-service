const config = require('./webpack.config.js');
config.mode = 'production';
config.output.filename = 'bcgov-formio-components.min.js';
module.exports = config;
