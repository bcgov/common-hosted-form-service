import 'cypress-keycloak-commands';

const depEnv = Cypress.env('depEnv');

Cypress.Commands.add('waitForLoad', () => {
  const loaderTimeout = 60000;

  cy.get('.nprogress-busy', { timeout: loaderTimeout }).should('not.exist');
});

beforeEach(() => {
  cy.waitForLoad();
});

describe('Admin Vue', () => {
  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("user");
  });

  it('Visits the admin page', () => {
    cy.visit(`/${depEnv}/admin`);
    cy.contains('Admin');
    cy.get('div.v-tab').contains('Form Modules').click();
  });
});
