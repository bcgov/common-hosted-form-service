import 'cypress-keycloak-commands';
import 'cypress-drag-drop';

const depEnv = Cypress.env('depEnv');

Cypress.Commands.add('waitForLoad', () => {
  const loaderTimeout = 60000;

  cy.get('.nprogress-busy', { timeout: loaderTimeout }).should('not.exist');
});



describe('Form Designer', () => {

  before(()=>{
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
    cy.get(`input[data-test='text-name']`).type('formSubmissionTest', { delay: 0 });
    cy.get('div').contains('Disclaimer').parent().find(`input[type='checkbox']`).parent().click();
    cy.get('button').contains('Continue').click();
    cy.get('h1').contains('Form Design');

    let textFields = ["First Name", "Middle Name", "Last Name"];

    for(let i=0; i<textFields.length; i++) {
      cy.get('button').contains('Basic Fields').click();
      cy.get('div.formio-builder-form').then($el => {
      const bounds = $el[0].getBoundingClientRect();
      cy.get('span.btn').contains('Text Field')
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', bounds.x, -50, { force: true })
        .trigger('mouseup', { force: true });
        cy.get('p').contains('Text Field Component');
        cy.get('input[name="data[label]"]').clear().type(textFields[i]);
        cy.get('button').contains('Save').click();
      });
    }

    cy.intercept('GET', `/${depEnv}/api/v1/forms/*`).as('getForm');

    let savedButton = cy.get('[data-cy=saveButton]');
    expect(savedButton).to.not.be.null;
    savedButton.trigger('click');

    cy.wait('@getForm').then(()=>{
      let userFormsLinks = cy.get('[data-cy=userFormsLinks]');
      expect(userFormsLinks).to.not.be.null;
      userFormsLinks.trigger('click');
    });

    cy.get(".submissions-table tbody").children().its('length').should('be.gte', 1);
    cy.contains('td', 'formSubmissionTest')  // gives you the cell
    .parent()                              // gives you the row
    .within($tr => {                    // filters just that row
    cy.wrap($tr).find('td').eq(1).contains('Manage')                  // finds the delete button
    .click()
    });

    let formPublishedSwitch = cy.get('[data-cy=formPublishedSwitch]');
    expect(formPublishedSwitch).to.not.be.null;
    formPublishedSwitch.parent().trigger('click');

    cy.get('span').contains('Publish Version 1');

    cy.contains('Continue').should('be.visible');
    cy.contains('Continue').trigger('click');

    let shareFormButton = cy.get('[data-cy=shareFormButton]');
    expect(shareFormButton).to.not.be.null;
    shareFormButton.trigger('click').then(()=>{
      let shareFormLinkButton = cy.get('[data-cy=shareFormLinkButtonss]');
      expect(shareFormLinkButton).to.not.be.null;
      shareFormLinkButton.trigger('click');
    });





  });

});
