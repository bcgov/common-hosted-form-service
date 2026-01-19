const { defineConfig } = require('cypress')
const fs = require('fs'); // Module for file system

module.exports = defineConfig({
  reporter: 'cypress-axe-reporter',
  reporterOptions: {
    reportDir: 'tests/functional/cypress/axe-reports',
    outputFormat: 'json',
  },
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
  fixturesFolder: 'fixtures',
  screenshotsFolder: 'screenshots',
  downloadsFolder:  'downloads',
  videosFolder: 'videos',
  
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    //setupNodeEvents(on, config) {
     // return require('./plugins/index.js')(on, config)
    
    //baseUrl: 'http://localhost:5173',
    baseUrl:'https://chefs-dev.apps.silver.devops.gov.bc.ca',
    specPattern: 'e2e/*.cy.{js,jsx,ts,tsx}',
    testIsolation: false,
    supportFile: 'support/e2e.js',
    numTestsKeptInMemory: 5,
    experimentalMemoryManagement: true,
    setupNodeEvents(on, config) {
      require('cypress-axe-reporter/plugin')(on);

      on('task', {
        fileExists(filePath) {
          return fs.existsSync(filePath);
        },
      });

      return config;
    },
  },
});