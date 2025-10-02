import 'cypress-keycloak-commands';

const depEnv = Cypress.env('depEnv');
const username=Cypress.env('keycloakUsername');
const password=Cypress.env('keycloakPassword');


Cypress.Commands.add('waitForLoad', () => {
  const loaderTimeout = 60000;

  cy.get('.nprogress-busy', { timeout: loaderTimeout }).should('not.exist');
});

describe('Form Designer', () => {

  beforeEach(()=>{
    cy.on('uncaught:exception', (err, runnable) => {
      // Form.io throws an uncaught exception for missing projectid
      // Cypress catches it as undefined: undefined so we can't get the text
      console.log(err);
      return false;
    });
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });
  it('Visits the form settings page', () => {
    
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    
  });  
// Publish a simple form with Simplebc Address component
 it('Verify public form submission', () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    cy.visit(`/${depEnv}`); 
    cy.get('#logoutButton > .v-btn__content > span').should('not.exist');
    cy.get('[data-test="base-auth-btn"] > .v-btn > .v-btn__content > span').click();
    cy.get('[data-test="idir"]').click();
    cy.get('#user').type(username);
    cy.get('#password').type(password);
    cy.get('.btn').click();
    cy.readFile('cypress/fixtures/formId.json').then(({ formId }) => {
    cy.visit(`/${depEnv}/form/manage?f=${formId}`);
    cy.wait(2000);
    //Publish the form
    cy.get('[data-cy="formPublishedSwitch"]').click();
    cy.get('span').contains('Publish Version 1');
    cy.contains('Continue').should('be.visible');
    cy.contains('Continue').trigger('click');
    cy.waitForLoad();
    //Manage form
    cy.get(':nth-child(1) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay').click();
    cy.get('[lang="en"] > .v-btn > .v-btn__content > .mdi-pencil').click();
    cy.get('[data-test="userType"] > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.contains('Public (anonymous)').click();
    cy.waitForLoad();
    cy.get(':nth-child(3) > .v-card > .v-card-text > :nth-child(2) > .v-input__control > .v-selection-control > .v-label > span').click();//uncheck for not able to update the status of the form
    cy.get('[data-test="canUpdateStatusOfFormCheckbox"]').should("not.be.checked");
    cy.contains('span','Display assignee column for reviewers').should("not.exist");
    cy.get('[data-test="canScheduleFormSubmissionCheckbox"]').find('input[type="checkbox"]').click();
    cy.get('[data-test="canEditForm"]').click();
    
    //Logout to submit the public form
    cy.get('#logoutButton > .v-btn__content > span').should('be.visible').click({ force: true });
    cy.log('Page visited, checking for logout button');
    cy.get('#logoutButton > .v-btn__content > span').should('not.exist');
    cy.get('[data-test="base-auth-btn"] > .v-btn > .v-btn__content > span', { timeout: 15000 }).should('be.visible').click();
    //Form submission and verification for public forms
    cy.visit(`/${depEnv}/form/submit?f=${formId}`);
    cy.waitForLoad();
    cy.get('button').contains('Submit').should('be.visible');
    cy.wait(2000);
    cy.contains('Text Field').click();
    cy.contains('Text Field').type('Alex');
    //form submission
    cy.get('button').contains('Submit').click();
    cy.waitForLoad();
    //cy.get('[data-test="continue-btn-continue"]').click({force: true});
    cy.wait(2000);
    cy.get('label').contains('Text Field').should('be.visible');
    cy.get('label').contains('Text Field').should('be.visible');
    cy.location('pathname').should('eq', `/${depEnv}/form/success`);
    cy.contains('h1', 'Your form has been submitted successfully');
    //view submission
    cy.visit(`/${depEnv}/form/manage?f=${formId}`);
    cy.get('.mdi-list-box-outline').click();
    cy.wait(2000);
    cy.contains('Assigned to me').should('not.exist');//Assigned to me checkbox
    //View the submission
    cy.get(':nth-child(1) > :nth-child(6) > a > .v-btn').click();
    cy.waitForLoad();
    //Verify status option is not available for this
    cy.get('.status-heading > .mdi-chevron-right').should('not.exist');
    cy.get('#logoutButton > .v-btn__content > span').click();

    });
      
  });

});