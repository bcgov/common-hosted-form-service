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
    cy.visit(`/${depEnv}/user/forms`);
    cy.location('pathname').should('eq', `/${depEnv}/user/forms`);
    cy.waitForLoad();

    cy.on('uncaught:exception', (err, runnable) => {
      // Form.io throws an uncaught exception for missing projectid
      // Cypress catches it as undefined: undefined so we can't get the text
      console.log(err);
      return false;
    });
    cy.get('h1').contains('My Forms');

    let formSubmissionsLink = cy.get('[data-cy=formSubmissionsLink]');
    expect(formSubmissionsLink).to.not.be.null;
    formSubmissionsLink.trigger('click');

    let viewColumnPreferenceClick = cy.get('[data-cy="viewColumnPreferences"]');
    expect(viewColumnPreferenceClick).to.not.be.null;
    viewColumnPreferenceClick.trigger('click');



  });

  it('All the fields checkboxes should be checked when select all checkbox is checked', async() => {


    //cy.get('input[data-cy=none-checkbox]').uncheck();

    cy.contains('Search and select fields to show under your dashboard').should('be.visible');

    cy.get('input[data-cy=none-checkbox]').parent().click({force: true});

    cy.get('input[data-cy=selectAll-checkbox]').should('not.be.checked');

    cy.get('.fieldCheckBoxeswrapper').find('[type="checkbox"]').its('length').should('be.gte', 1);

    cy.get('.fieldCheckBoxeswrapper').find('[type="checkbox"]').each(checkbox => {
      expect(checkbox[0].checked).to.equal(false);
    })

   let columnPreferencesSaveBtn = cy.get('[data-cy=columnPreferencesSaveBtn]');
    expect(columnPreferencesSaveBtn).to.not.be.null;
    columnPreferencesSaveBtn.trigger('click');
    cy.wait(200);
    cy.get(".submissions-table tbody tr").children().its('length').should('be.eq', 4);

  });

  it('All the fields checkboxes should be unchecked when none checkbox is checked', () => {

   // cy.get('input[data-cy=selectAll-checkbox]').uncheck();

    cy.contains('Search and select fields to show under your dashboard').should('be.visible');

    cy.get('input[data-cy=selectAll-checkbox]').parent().click({force: true});

    cy.get('input[data-cy=none-checkbox]').should('not.be.checked')


    cy.get('.fieldCheckBoxeswrapper').find('[type="checkbox"]').its('length').should('be.gte', 1);

    cy.get('.fieldCheckBoxeswrapper').find('[type="checkbox"]').each(checkbox => {
      expect(checkbox[0].checked).to.equal(true);
    });

    let columnPreferencesSaveBtn = cy.get('[data-cy=columnPreferencesSaveBtn]');
    expect(columnPreferencesSaveBtn).to.not.be.null;
    columnPreferencesSaveBtn.trigger('click');

    cy.wait(200);

    cy.get(".submissions-table tbody tr").children().its('length').should('be.gt', 4);


  })


});