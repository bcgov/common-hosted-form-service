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
 it('Make form to public', () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
    cy.visit(`/${depEnv}`); 
    cy.get('#logoutButton > .v-btn__content > span').should('not.exist');
    cy.get('#loginButton').click();
    cy.get('[data-test="idir"]').click();
    cy.get('#user').type(username);
    cy.get('#password').type(password);
    cy.get('.btn').click();
    cy.readFile('cypress/fixtures/formId.json').then(({ formId }) => {
    cy.visit(`/${depEnv}/form/manage?f=${formId}`);
    });
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
    cy.wait(1000);
    //Validate the default privacy settings for public form
    cy.get('[data-test="enableSubmissionUrlSharingCheckbox"] input[type="checkbox"]').should('be.checked');
    cy.get('[data-test="canAllowSubmissionConfirmationCheckbox"] input[type="checkbox"]').should('be.checked');
    cy.get('[data-test="enableSubmitterEmailReceiptCheckbox"] input[type="checkbox"]').should('be.checked');
    cy.get('[data-test="hideSubmissionContentOnSuccessCheckbox"] input[type="checkbox"]').should('not.be.checked');
    //disable confirmation id
    cy.get('[data-test="canAllowSubmissionConfirmationCheckbox"] input[type="checkbox"]').click();
    //Hide  submission content on success page
    cy.get('[data-test="hideSubmissionContentOnSuccessCheckbox"] input[type="checkbox"]').click();
    cy.waitForLoad();
    cy.get(':nth-child(3) > .v-card > .v-card-text > :nth-child(2) > .v-input__control > .v-selection-control > .v-label > span').click();//uncheck for not able to update the status of the form
    cy.get('[data-test="canUpdateStatusOfFormCheckbox"]').should("not.be.checked");
    cy.contains('span','Display assignee column for reviewers').should("not.exist");
    cy.get('[data-test="canScheduleFormSubmissionCheckbox"]').find('input[type="checkbox"]').click();
    cy.get('[data-test="enableTeamMemberDraftShare"]').find('input[type="checkbox"]').should('not.be.enabled')
    .and("not.be.checked");
    cy.get('[data-test="canUploadDraftCheckbox"]').find('input[type="checkbox"]').should('not.be.enabled')
    .and("not.be.checked");
    cy.get('[data-test="canCopyExistingSubmissionCheckbox"]').find('input[type="checkbox"]').should('not.be.enabled')
    .and("not.be.checked");
    cy.get('[data-test="canSubmitterRevisionFormCheckbox"]').find('input[type="checkbox"]').should('not.be.enabled')
    .and("not.be.checked");
    cy.get('[data-test="canEditForm"]').click();
    //Logout to submit the public form
    cy.get('#logoutButton').click({ force: true });
    cy.log('Page visited, checking for logout button');
    cy.get('#logoutButton').should('not.exist');
  });    
// Publish a simple form with Simplebc Address component
  it('Verify public form submission', () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
    //Form submission and verification for public forms
    cy.readFile('cypress/fixtures/formId.json').then(({ formId }) => {
    cy.visit(`/${depEnv}/form/submit?f=${formId}`);
    });
    cy.waitForLoad();
    cy.get('button').contains('Submit').should('be.visible');
    cy.wait(2000);
    cy.contains('Text Field').click();
    cy.contains('Text Field').type('Alex');
    //Draft manage button existence
    cy.get('.d-inline-block').should('not.exist');
    //form submission
    cy.get('button').contains('Submit').click();
    cy.wait(2000);
    //Validate submission details are not visible on success page for public form
    cy.get('label').contains('Text Field').should('not.exist');
    cy.location('pathname').should('eq', `/${depEnv}/form/success`);
    cy.contains('h1', 'Your form has been submitted successfully');
    cy.wait(1000);
    //Validate confirmation ID is not visible on success page for public form
    cy.contains('Confirmation ID:').should('not.exist');
    // Receipent email option validation for public form submission
    cy.get('span').contains('Email a receipt of this submission').should('be.visible');
    //Email notification
    cy.get('button[title="Email a receipt of this submission"]').should('be.visible');
    cy.get('button[title="Email a receipt of this submission"]').click();
    cy.get('[data-test="text-form-to"]').find('input[type="text"]').type('testing@gov.bc.ca');
    cy.wait(1000);
    cy.get('.v-form > .v-select > .v-input__control > .v-field > .v-field__append-inner > .mdi-menu-down').click();
    cy.contains('Normal').should('exist'); 
    cy.contains('High').should('exist');
    cy.contains('Low').should('exist');
    cy.get('.v-form > .v-select > .v-input__control > .v-field > .v-field__append-inner > .mdi-menu-down').click();
    cy.get('span').contains('SEND').should('be.visible');
    cy.get('[data-test="continue-btn-cancel"]').click();
    cy.get('button[title="Email a receipt of this submission"]').click();
    cy.get('span').contains('SEND').click();
    cy.get('.v-alert__content').contains('div','An email has been sent to testing@gov.bc.ca.').should('be.visible');
    //view submission
    cy.readFile('cypress/fixtures/formId.json').then(({ formId }) => {
    cy.visit(`/${depEnv}/form/manage?f=${formId}`);
    });
    cy.wait(1000);
    //Login to view submissions
    cy.get('[data-test="login-btn"]').click();
    cy.get('[data-test="idir"]').click();
    cy.get('#user').type(username);
    cy.get('#password').type(password);
    cy.get('.btn').click();
    cy.wait(1000);
    cy.get('.mdi-list-box-outline').click();
    cy.wait(1000);
    cy.contains('Assigned to me').should('not.exist');//Assigned to me checkbox
    //View the submission
    cy.get(':nth-child(1) > :nth-child(6) > a > .v-btn').click();
    cy.waitForLoad();
    //Verify status option is not available for this
    cy.get('.status-heading > .mdi-chevron-right').should('not.exist');
    cy.get('.mdi-logout').click();


    });
      
});