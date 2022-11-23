import 'cypress-keycloak-commands';
import 'cypress-drag-drop';

const depEnv = Cypress.env('depEnv');

Cypress.Commands.add('waitForLoad', () => {
  const loaderTimeout = 60000;

  cy.get('.nprogress-busy', { timeout: loaderTimeout }).should('not.exist');
});


describe('Form Designer', () => {
  beforeEach(()=>{
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
  })


  it('Visits the designer page', () => {
    cy.intercept('GET', `/${depEnv}/api/v1/forms/*`).as('getForm');
    cy.get('button').contains('Basic Fields').click();
    const numComponents = 3;
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
    cy.get('[data-cy=saveButton]').should('exist');
    cy.get('[data-cy=saveButton]').trigger('click');
  });

  it('undo method has been called', () => {

    cy.intercept('GET', `/${depEnv}/api/v1/forms/*`).as('getForm');
    cy.get('button').contains('Basic Fields').click();
    cy.get('[data-cy=undoButton]').should('have.class','disabled-router');
    const numComponents = 3;
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

    cy.get('[data-cy=undoButton]').should('exist');
    cy.get('[data-cy=undoButton]').should('not.have.class','disabled-router');
    for (let i = 0; i < numComponents; i++) {
      cy.get('[data-cy=undoButton]').trigger('click');
    }

    cy.get('[data-cy=undoButton]').should('have.class','disabled-router');
  });

  it('redo method has been called', () => {

    cy.intercept('GET', `/${depEnv}/api/v1/forms/*`).as('getForm');
    cy.get('button').contains('Basic Fields').click();

    cy.get('[data-cy=redoButton]').should('exist');
    cy.get('[data-cy=undoButton]').should('exist');

    cy.get('[data-cy=redoButton]').should('have.class','disabled-router');
    cy.get('[data-cy=undoButton]').should('have.class','disabled-router');

    const numComponents = 3;
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


    cy.get('[data-cy=undoButton]').should('not.have.class','disabled-router');

    cy.wait(800);

    cy.get('[data-cy=redoButton]').should('have.class','disabled-router');

    for (let i = 0; i < numComponents; i++) {
      cy.get('[data-cy=undoButton]').trigger('click');
    }

    cy.get('[data-cy=undoButton]').should('have.class','disabled-router');


    cy.get('[data-cy=redoButton]').should('not.have.class','disabled-router');

    for (let i = 0; i < numComponents; i++) {
      cy.get('[data-cy=redoButton]').trigger('click');
    }

    cy.get('[data-cy=redoButton]').should('have.class','disabled-router');

  });


  it('manage/settings method has been called', () => {

    cy.intercept('GET', `/${depEnv}/api/v1/forms/*`).as('getForm');
    cy.get('button').contains('Basic Fields').click();

    cy.get('[data-cy=settingsRouterLink]').should('exist');


    const numComponents = 3;
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

    cy.get('[data-cy=saveButton]').should('exist');
    cy.get('[data-cy=saveButton]').trigger('click');
    cy.wait('@getForm').then(()=>{
      cy.get('[data-cy=settingsRouterLink]').trigger('click').then(()=>{
        cy.contains('Manage Form');
      })

    });
  });


  it('publish method has been called', () => {

    cy.intercept('GET', `/${depEnv}/api/v1/forms/*`).as('getForm');
    cy.get('button').contains('Basic Fields').click();

    cy.get('[data-cy=publishRouterLink]').should('exist');


    const numComponents = 3;
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

    cy.get('[data-cy=saveButton]').should('exist');
    cy.get('[data-cy=saveButton]').trigger('click');
    cy.wait('@getForm').then(()=>{
      cy.get('[data-cy=publishRouterLink]').trigger('click').then(()=>{
        cy.contains('Continue').should('exist');
        cy.contains('Cancel').should('exist');;
      })

    });
  });

});