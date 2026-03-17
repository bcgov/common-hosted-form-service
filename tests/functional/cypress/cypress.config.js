const { defineConfig } = require('cypress')
const fs = require('fs');
const path = require('path'); // ✅ import path module

module.exports = defineConfig({
  reporter: 'cypress-axe-reporter',
  reporterOptions: {
    reportDir: 'axe-reports',
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
  // Define all tasks
  on('task', {
    // Your existing task
    fileExists(filePath) {
      return fs.existsSync(filePath);
    },

    // Task to write axe reports
    writeAxeReport({ results, filePath }) {
      // Ensure folder exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write JSON file
      fs.writeFileSync(path.resolve(filePath), JSON.stringify(results, null, 2));
      console.log(`Axe report written to: ${filePath}`);
      return null; // Cypress requires tasks to return null or a value
    },
  });

  return config;
}
  },
});