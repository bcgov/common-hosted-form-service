const { defineConfig } = require('cypress')

module.exports = defineConfig({
  env: {
    depEnv: 'app',
    auth_base_url: 'http://localhost:8082',
    auth_realm: 'chefs',
    auth_client_id: 'chefs-frontend',
    keycloakUrl: 'http://localhost:8082',
    keycloakRealm: 'chefs',
    keycloakClientId: 'chefs-frontend',
    keycloakUsername: 'testuser@gmail.com',
    keycloakPassword: 'testuser',
  },
  chromeWebSecurity: false,
  video: false,
  fixturesFolder: 'fixtures',
  screenshotsFolder: 'screenshots',
  videosFolder: 'videos',
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    //setupNodeEvents(on, config) {
     // return require('./plugins/index.js')(on, config)
    
    baseUrl: 'http://localhost:5173',
    specPattern: 'specs/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'support/index.js',
  }
  },
)
