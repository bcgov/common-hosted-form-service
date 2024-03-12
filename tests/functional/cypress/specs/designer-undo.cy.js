import 'cypress-keycloak-commands';
import 'cypress-drag-drop';

const depEnv = Cypress.env('depEnv');

Cypress.Commands.add('waitForLoad', () => {
  const loaderTimeout = 60000;

  cy.get('.nprogress-busy', { timeout: loaderTimeout }).should('not.exist');
});

Cypress.Commands.add('undo', () => {
  cy.get('i').contains('undo').parent().parent().click();
});

Cypress.Commands.add('redo', () => {
  cy.get('i').contains('redo').parent().parent().click();
});

describe('Form Designer', () => {

  beforeEach(() => {
    cy.viewport(1000, 1800);
    cy.waitForLoad();
    cy.kcLogout();
    cy.kcLogin("user");
    cy.visit(`/${depEnv}/form/create`);
    cy.location('pathname').should('eq', `/${depEnv}/form/create`);
    cy.on('uncaught:exception', (err, runnable) => {
      // Form.io throws an uncaught exception for missing projectid
      // Cypress catches it as undefined: undefined so we can't get the text
      console.log(err);
      return false;
    });
    cy.get(`input[data-test='text-name']`).type('Test', { delay: 0 });
    cy.get('div').contains('Disclaimer').parent().find(`input[type='checkbox']`).parent().click();
    cy.get('button').contains('Continue').click();
    cy.get('h1').contains('Form Design');
  });

  it('Visits the designer page', () => {
    cy.intercept('GET', `/${depEnv}/api/v1/forms/*`).as('getForm');
    cy.get('button').contains('Basic Fields').click();
    const numComponents = 6;
    for (let i = 0; i < numComponents; i++) {
      cy.get('div.formio-builder-form').then($el => {
        const bounds = $el[0].getBoundingClientRect();
        cy.get('span.btn').contains('Text Field')
          .trigger('mousedown', { which: 1}, { force: true })
          .trigger('mousemove', bounds.x, -50, { force: true })
          .trigger('mouseup', { force: true });
        cy.get('button').contains('Save').click();
      });
    }
    for (let i = 0; i < (numComponents / 2); i++) {
      cy.undo();
    }
    cy.get('i').contains('undo').parent().contains((numComponents / 2).toString());
    cy.get('i').contains('redo').parent().contains((numComponents / 2).toString());
    for (let i = 0; i < (numComponents / 2); i++) {
      cy.redo();
    }
    cy.get('i').contains('undo').parent().contains((numComponents).toString());
    cy.get('i').contains('redo').parent().contains('0');
  });

  it('Does not increment actions when switching tabs', () => {
    cy.intercept('GET', `/${depEnv}/api/v1/forms/*`).as('getForm');
    cy.get('button').contains('Basic Layout').click();
    cy.get('div.formio-builder-form').then($el => {
      const bounds = $el[0].getBoundingClientRect();
      cy.get('span.btn').contains('Tabs')
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', bounds.x, -100, { force: true })
        .trigger('mouseup', { force: true });

      cy.wait(100);
      cy.get('button').contains('Add Another').click();
      cy.get('tbody').children().last().find('input').first().type('Tab 2');
      cy.get('button').contains('Save').click();
      cy.get('a').contains('Tab 2').click();
      cy.get('i').contains('undo').parent().contains('1');
      cy.get('i').contains('redo').parent().contains('0');
      cy.get('a').contains('Tab 1').click();
      cy.get('i').contains('undo').parent().contains('1');
      cy.get('i').contains('redo').parent().contains('0');
    });
  });
});