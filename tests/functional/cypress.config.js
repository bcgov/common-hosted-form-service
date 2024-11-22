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
    keycloakUsername: 'admin',
    keycloakPassword: 'admin',
  },
  chromeWebSecurity: false,
  video: false,
  fixturesFolder: 'cypress/fixtures',
  screenshotsFolder: 'screenshots',
  downloadsFolder:  'cypress/downloads',
  videosFolder: 'videos',
  
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    //setupNodeEvents(on, config) {
     // return require('./plugins/index.js')(on, config)
    
    //baseUrl: 'http://localhost:5173',
    baseUrl:'https://chefs-dev.apps.silver.devops.gov.bc.ca',
    specPattern: 'cypress/e2e/*.cy.{js,jsx,ts,tsx}',
    testIsolation: false,
    
    //supportFile: 'support/index.js',
  }
  },
)
