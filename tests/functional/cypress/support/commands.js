import 'cypress-file-upload';
import 'cypress-axe';
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add('checkA11yPage', () => {
  cy.get('body', { timeout: 10000 }).should('be.visible');
  cy.injectAxe();

  cy.checkA11y(null, {
    includedImpacts: ['critical', 'serious', 'moderate', 'minor'],
    skipFailures: true,
  }, cy.cypressAxeReporterCallBack, true);
});