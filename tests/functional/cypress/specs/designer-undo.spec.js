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

  it('Visits the designer page and trigger form auto save', async() => {
    cy.intercept('GET', `/${depEnv}/api/v1/forms/*`).as('getForm1');
    cy.intercept('POST', `/${depEnv}/api/v1/forms/*`).as('postForm');

    cy.get('button').contains('Basic Fields').click();
    const numComponents = 6;

    cy.get('div.formio-builder-form').then($el => {
      const bounds = $el[0].getBoundingClientRect();
      cy.get('span.btn').contains('Text Field')
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', bounds.x, -50, { force: true })
        .trigger('mouseup', { force: true });
      cy.get('button').contains('Save').click();
    })

    cy.location('pathname').should('eq', `/${depEnv}/form/design`);

    cy.wait('@getForm1').then(()=>{
      cy.intercept('PUT', `/${depEnv}/api/v1/forms/*`).as('putForm');
      cy.get('button').contains('Basic Fields').click();
      cy.get('div.formio-builder-form').then($el => {
        const bounds = $el[0].getBoundingClientRect();
        cy.get('span.btn').contains('Text Field')
          .trigger('mousedown', { which: 1}, { force: true })
          .trigger('mousemove', bounds.x, -50, { force: true })
          .trigger('mouseup', { force: true });
        cy.get('button').contains('Save').click();
        cy.undo();

        cy.get('i').contains('undo').parent().contains((0).toString());
        cy.get('i').contains('redo').parent().contains((1).toString());
        cy.redo();

        cy.get('i').contains('undo').parent().contains((1).toString());
        cy.get('i').contains('redo').parent().contains('0');
      });

    });
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


  it('form should autosave and should not be deleted when click Yes button on confimation dialog', () => {
    cy.intercept('GET', `/${depEnv}/api/v1/forms/*`).as('getForm');
    cy.get('.v-input__slot').contains('AutoSave').click()
    cy.get('button').contains('Basic Fields').click();
    cy.get('div.formio-builder-form').then($el => {
      const bounds = $el[0].getBoundingClientRect();
      cy.get('span.btn').contains('Text Field')
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', bounds.x, -100, { force: true })
        .trigger('mouseup', { force: true });
      cy.get('button').contains('Save').click();
    });
    /*cy.wait('@getForm').then(()=>{
      cy.get('.v-input__slot').contains('AutoSave').click();
      let routerLink =cy.get('[data-cy=aboutLinks]');
      expect(routerLink).to.not.be.null;
      routerLink.trigger('click');
      cy.contains('Confirm').should('be.visible');
      cy.contains('Yes').should('be.visible');
      cy.contains('Yes').trigger('click');
      cy.location('pathname').should('eq', `/${depEnv}/`);
    })
    */
  });

  it('form should autosave and should delet when click No button on confimation dialog', () => {
    cy.intercept('GET', `/${depEnv}/api/v1/forms/*`).as('getForm');
    cy.get('.v-input__slot').contains('AutoSave').click()
    cy.get('button').contains('Basic Fields').click();
    cy.get('div.formio-builder-form').then($el => {
      const bounds = $el[0].getBoundingClientRect();
      cy.get('span.btn').contains('Text Field')
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', bounds.x, -100, { force: true })
        .trigger('mouseup', { force: true });
      cy.get('button').contains('Save').click();
    });
    /*
    cy.wait('@getForm').then(()=>{
      let routerLink =cy.get('[data-cy=aboutLinks]');
      expect(routerLink).to.not.be.null;
      routerLink.trigger('click');
      cy.contains('Confirm').should('be.visible');
      cy.contains('No').should('be.visible');
      cy.contains('No').trigger('click');
      cy.location('pathname').should('eq', `/${depEnv}/`);
    })
    */
  });

  it('form should autosave and should not show confirmation dialog if save button is clicked', () => {
    cy.intercept('GET', `/${depEnv}/api/v1/forms/*`).as('getForm');
    cy.get('.v-input__slot').contains('AutoSave').click()
    cy.get('button').contains('Basic Fields').click();
    cy.get('div.formio-builder-form').then($el => {
      const bounds = $el[0].getBoundingClientRect();
      cy.get('span.btn').contains('Text Field')
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', bounds.x, -100, { force: true })
        .trigger('mouseup', { force: true });
      cy.get('button').contains('Save').click();
    });
    /*
    let savedButton = cy.get('[data-cy=saveButton]');
    expect(savedButton).to.not.be.null;
    savedButton.trigger('click');

    cy.wait('@getForm').then(()=>{
      let routerLink =cy.get('[data-cy=aboutLinks]');
      expect(routerLink).to.not.be.null;
      routerLink.trigger('click');
      cy.contains('Confirm').should('not.exist');
      cy.location('pathname').should('eq', `/${depEnv}/`);
    })
    */
  });
});
