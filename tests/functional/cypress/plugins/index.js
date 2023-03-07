/* eslint-disable arrow-body-style */
// https://docs.cypress.io/guides/guides/plugins-guide.html

// if you need a custom webpack configuration you can uncomment the following import
// and then use the `file:preprocessor` event
// as explained in the cypress docs
// https://docs.cypress.io/api/plugins/preprocessors-api.html#Examples

// /* eslint-disable import/no-extraneous-dependencies, global-require */
// const webpack = require('@cypress/webpack-preprocessor')

module.exports = (on, config) => {
  // on('file:preprocessor', webpack({
  //  webpackOptions: require('@vue/cli-service/webpack.config'),
  //  watchOptions: {}
  // }))

  on('task', {
    log(message) {
      console.log(message)

      return null
    },
  });
  return Object.assign({}, config, {
    fixturesFolder: 'fixtures',
    integrationFolder: 'specs',
    screenshotsFolder: 'screenshots',
    videosFolder: 'videos',
    supportFile: 'support/index.js'
  });
};
