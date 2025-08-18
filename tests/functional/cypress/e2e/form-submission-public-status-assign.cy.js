import 'cypress-keycloak-commands';
import { formsettings } from '../support/login.js';

const depEnv = Cypress.env('depEnv');
const username=Cypress.env('keycloakUsername');
const password=Cypress.env('keycloakPassword');


Cypress.Commands.add('waitForLoad', () => {
  const loaderTimeout = 60000;

  cy.get('.nprogress-busy', { timeout: loaderTimeout }).should('not.exist');
});

describe('Form Designer', () => {

  beforeEach(()=>{
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });
  it('Visits the form settings page', () => {
    
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    formsettings();
    
  });  
// Publish a simple form with Simplebc Address component
 it('Verify public form submission', () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    
    cy.get('button').contains('Basic Fields').click();
    cy.get('div.formio-builder-form').then($el => {
      const coords = $el[0].getBoundingClientRect();
      cy.get('span.btn').contains('Text Field')
      
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -110, { force: true })
      .trigger('mouseup', { force: true });
      cy.get('button').contains('Save').click();
      cy.waitForLoad();
    });
  // Form saving
    let savedButton = cy.get('[data-cy=saveButton]');
    expect(savedButton).to.not.be.null;
    cy.get('.mdi-content-save').should('be.visible').trigger('click');
    cy.wait(2000);
  // Filter the newly created form
    cy.location('search').then(search => {
      //let pathName = fullUrl.pathname
      let arr = search.split('=');
      let arrayValues = arr[1].split('&');
      cy.log(arrayValues[0]);
      cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
      cy.waitForLoad();
    //Publish the form
    cy.get('.v-label > span').click();

    cy.get('span').contains('Publish Version 1');

    cy.contains('Continue').should('be.visible');
    cy.contains('Continue').trigger('click');
    //Share link verification
    let shareFormButton = cy.get('[data-cy=shareFormButton]');
    expect(shareFormButton).to.not.be.null;
    shareFormButton.trigger('click').then(()=>{
      
    let shareFormLinkButton=cy.get('.mx-2');
    expect(shareFormLinkButton).to.not.be.null;
    shareFormLinkButton.trigger('click');
    cy.get('.mx-2 > .v-btn').click();
    })
    cy.visit(`/${depEnv}`);
    cy.get('[data-cy="userFormsLinks"]').click();
    cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
    cy.waitForLoad();
    cy.get(':nth-child(1) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay').click();
    cy.get('[lang="en"] > .v-btn > .v-btn__content > .mdi-pencil').click();
    cy.get('[data-test="userType"] > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.contains('Public (anonymous)').click();
    cy.waitForLoad();
    //Validate checkbox settings on form settings page
    cy.get('[data-test="canSaveAndEditDraftsCheckbox"]').should("not.be.enabled");
    cy.get('[data-test="canUpdateStatusOfFormCheckbox"]').find('input[type="checkbox"]').should('be.checked');
    cy.get('[data-test="showAssigneeInSubmissionsTableCheckbox"]').find('input[type="checkbox"]').should('be.checked');
    cy.get('[data-test="canScheduleFormSubmissionCheckbox"]').find('input[type="checkbox"]').should('be.enabled');
    cy.get('[data-test="canCopyExistingSubmissionCheckbox"]').find('input[type="checkbox"]').should("not.be.enabled");
    cy.get('[data-test="canAllowEventSubscriptionCheckbox"]').find('input[type="checkbox"]').should("be.enabled"); 
    cy.get('[data-test="canSubmitterRevisionFormCheckbox"]').find('input[type="checkbox"]').should("not.be.enabled");
    cy.get('[data-test="canUploadDraftCheckbox"]').find('input[type="checkbox"]').should("not.be.enabled");
    cy.get('[data-test="canAllowWideFormLayoutCheckbox"]').find('input[type="checkbox"]').should('be.checked');
    cy.get('[data-test="enableTeamMemberDraftShare"]').find('input[type="checkbox"]').should("not.be.enabled");    
    cy.get('[data-test="canEditForm"]').click();
    //Check team management functionality for public forms
    cy.get('[data-test="canManageTeammembers"]').click();
    cy.get('.mdi-account-plus').click();
    //Search for a member to add
    cy.get('.v-col > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.get('.v-col > .v-btn--variant-outlined > .v-btn__content > span').click();
    cy.wait(3000);
    cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
    cy.waitForLoad();
      //Logout to submit the public form
    cy.get('#logoutButton > .v-btn__content > span').should('be.visible').click({ force: true });
    cy.log('Page visited, checking for logout button');
    cy.get('#logoutButton > .v-btn__content > span').should('not.exist');
    //Form submission and verification for public forms
    cy.visit(`/${depEnv}/form/submit?f=${arrayValues[0]}`);
    cy.waitForLoad();
    cy.get('button').contains('Submit').should('be.visible');
    cy.wait(2000);
    cy.contains('Text Field').click();
    cy.contains('Text Field').type('Alex');
    //form submission
    cy.get('button').contains('Submit').click();
    //cy.get('[data-test="continue-btn-continue"]').click({force: true});
    cy.wait(2000);
    cy.get('label').contains('Text Field').should('be.visible');
    cy.get('label').contains('Text Field').should('be.visible');
    cy.location('pathname').should('eq', `/${depEnv}/form/success`);
    cy.contains('h1', 'Your form has been submitted successfully');
    //Recall submission not avaiable for public forms
    cy.get('button[title="Recall Submission"]').should('not.exist');
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
    cy.visit(`/${depEnv}`);   
    cy.get('[data-test="base-auth-btn"] > .v-btn > .v-btn__content > span').click();
    cy.get('[data-test="idir"]').click();     
    cy.get('#user').type(username);
    cy.get('#password').type(password);
    cy.get('.btn').click();
    cy.wait(2000);
    //view submission   
    cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
    cy.get('.mdi-list-box-outline').click();
    cy.waitForLoad();
    cy.contains('Assigned to me').should('exist');//Assigned to me checkbox
    //View the submission
    cy.get(':nth-child(7) > a > .v-btn').click();
    });
    //Assign status submission
    cy.get('.status-heading > .mdi-chevron-right').click();
    cy.get('[data-test="showStatusList"] > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.waitForLoad();
    cy.contains('ASSIGNED').should('be.visible');
    cy.contains('REVISED').should('not.exist');
    cy.contains('COMPLETED').should('be.visible');
    cy.contains('ASSIGNED').click();
    cy.get('[data-test="canAssignToMe"] > .v-btn__content > span').should('be.visible');
    cy.get('[data-test="showAssigneeList"] > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.get('[data-test="showAssigneeList"] > .v-input__control > .v-field > .v-field__field > .v-field__input').type('ch');
    cy.get('div').contains('CHEFS Testing').click();
    cy.get('[data-test="updateStatusToNew"] > .v-btn__content > span').click();
    cy.wait(2000);
    cy.get('[data-test="showStatusList"] > .v-input__control > .v-field > .v-field__field > .v-field__input').click({force: true});
    cy.wait(2000);
    cy.contains('COMPLETED');
    cy.contains('COMPLETED').click();
    cy.wait(2000);
    cy.get('button').contains('COMPLETE').click();
    //Adding notes to submission
    cy.get('.mdi-plus').click();
    cy.get('div').find('textarea').then($el => {
      const rem=$el[0];
      rem.click();
      cy.get(rem).type('some notes');
    });
    //Verify  submitted by label is public
    cy.get('p').contains('public').should('be.visible');
    //Edit submission data for public form
    cy.get('.mdi-pencil').click();
    //check visibility of cancel button
    cy.get('.v-col-2 > .v-btn').should('be.visible');
    cy.get('button').contains('Submit').should('be.visible');
    cy.contains('Text Field').click();
    cy.contains('Text Field').type('Smith');
    cy.get('button').contains('Submit').click();
    cy.wait(2000);
    //Verify Edit History Panel
    cy.get('.mdi-history').click();
    cy.get('.v-data-table__tr> :nth-child(1)').contains('CHEFSTST@idir').should('be.visible');
    cy.get('span').contains('Close').click();
    cy.get('.mdi-list-box-outline').click();
    cy.waitForLoad();
    cy.get('.mdi-cog').click();
    //Delete form after test run
    cy.waitForLoad();
    cy.get(':nth-child(5) > .v-btn > .v-btn__content > .mdi-delete').click();
    cy.get('[data-test="continue-btn-continue"]').click();
    cy.get('#logoutButton > .v-btn__content > span').click();
  });
    
});
