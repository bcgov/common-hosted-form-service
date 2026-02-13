import 'cypress-keycloak-commands';
import { formsettings } from '../support/login.js';

const depEnv = Cypress.env('depEnv');


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
  });
  it('Visits the form settings page', () => {
    
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    formsettings();
  }); 
  it('Getting page ready', () => {
    cy.viewport(1000, 1100);
    cy.get('button').contains('Basic Fields').click();  
        
  }); 
// Publish a simple form 
it('Verify draft submission', () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    //Phone Number
    cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('span.btn').contains('Phone Number')
        
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -410, { force: true })
        .trigger('mouseup', { force: true });
        cy.get('.btn-success').click();
    });
    //Text field
    cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('span.btn').contains('Text Field')
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -110, { force: true })
        .trigger('mouseup', { force: true });
        cy.get('.btn-success').click();
    });
    cy.wait(1000);
  // Form saving
    let savedButton = cy.get('[data-cy=saveButton]');
    expect(savedButton).to.not.be.null;
    savedButton.trigger('click');
    cy.wait(3000);
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
      //let shareFormLinkButton = cy.get('[data-cy=shareFormLinkButtonss]');
      let shareFormLinkButton=cy.get('.mx-2');
      expect(shareFormLinkButton).to.not.be.null;
      shareFormLinkButton.trigger('click');
      cy.get('.mx-2 > .v-btn').click();
    })
      //Draft submission and verification
    cy.visit(`/${depEnv}/form/submit?f=${arrayValues[0]}`);
    cy.waitForLoad();
    cy.get('button').contains('Submit').should('be.visible');
    cy.waitForLoad();
    cy.waitForLoad();
    cy.contains('Text Field').click();
    cy.contains('Text Field').type('Alex');
    cy.get('.mt-6 > :nth-child(1) > .v-btn > .v-btn__content > span').click();
    cy.get('.v-card-actions > div > .bg-primary').click();
    cy.get('.v-data-table__tr > :nth-child(4)').contains('DRAFT');
    });

});
it('Submission revise status Assignment', () => {
    cy.viewport(1000, 1100);
    cy.wait(2000);
    cy.location('search').then(search => {
        //let pathName = fullUrl.pathname
        let arr = search.split('=');
        let arrayValues = arr[1].split('&');
        cy.log(arrayValues[0]);
    cy.get('.mdi-pencil').click();
    cy.get(':nth-child(4) > .v-btn').click();
    cy.waitForLoad();
    cy.get('.v-alert__content > div').contains('Draft Saved');
    //Manage  members for draft management
    cy.get('.mdi-account-multiple').click();
    cy.get('form > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.get('.v-card-actions > .v-btn > .v-btn__content > span').click();
    cy.waitForLoad();
    // Edit draft submission
    cy.get('.mt-6 > :nth-child(1) > .v-btn > .v-btn__content > span').click();
    cy.get('.mdi-pencil').click();
    cy.waitForLoad();
    //Form submission
    cy.contains('Text Field').click();
    cy.contains('Text Field').type('{selectall}{backspace}');
    cy.contains('Text Field').type('Nancy');
    cy.get('label').contains('Phone Number').should('be.visible');
    cy.get('button').contains('Submit').click();
    cy.waitForLoad();
    cy.get('[data-test="continue-btn-continue"]').click({force: true});
    cy.waitForLoad();
    cy.location('pathname').should('eq', `/${depEnv}/form/success`);
    cy.contains('h1', 'Your form has been submitted successfully');
    cy.wait(1000);
    cy.get('button[title="Email a receipt of this submission"]').should('be.visible');
    cy.get('button[title="Email a receipt of this submission"]').click();
    cy.get('[data-test="text-form-to"]').find('input[type="text"]').should('have.value','chefs.testing@gov.bc.ca');
    cy.wait(1000);
    cy.get('.v-form > .v-select > .v-input__control > .v-field > .v-field__append-inner > .mdi-menu-down');
    cy.get('.v-form > .v-select > .v-input__control > .v-field > .v-field__append-inner > .mdi-menu-down').click();
    cy.contains('Normal').should('exist'); 
    cy.contains('High').should('exist');
    cy.contains('Low').should('exist');
    cy.get('.v-form > .v-select > .v-input__control > .v-field > .v-field__append-inner > .mdi-menu-down').click();
    cy.get('span').contains('SEND').should('be.visible');
    cy.get('[data-test="continue-btn-cancel"]').click();
    cy.get('button[title="Email a receipt of this submission"]').click();
    cy.get('span').contains('SEND').click();
    cy.get('.v-alert__content').contains('div','An email has been sent to chefs.testing@gov.bc.ca.').should('be.visible');
    cy.get('.mt-6 > :nth-child(1) > .v-btn > .v-btn__content > span').click();
    //Assign status submission
    cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
    cy.get('.mdi-list-box-outline').click();
    cy.waitForLoad();
    cy.get(':nth-child(1) > :nth-child(7) > a > .v-btn').click();
    cy.get('.status-heading > .mdi-chevron-right').click();
    cy.get('[data-test="showStatusList"] > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.contains('ASSIGNED').click();
    cy.get('[data-test="canAssignToMe"] > .v-btn__content > span').should('be.visible');
    cy.get('[data-test="showAssigneeList"] > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.get('[data-test="showAssigneeList"] > .v-input__control > .v-field > .v-field__field > .v-field__input').type('ch');
    cy.get('div').contains('CHEFS Testing').click();
    cy.get('[data-test="updateStatusToNew"] > .v-btn__content > span').click();
    cy.wait(2000);
    cy.get('[data-test="showStatusList"] > .v-input__control > .v-field > .v-field__append-inner > .mdi-menu-down').click();
    cy.contains('REVISING').click();
    //cy.get('.v-selection-control > .v-label').click();
    cy.get('.v-chip__content').contains('chefs.testing@gov.bc.ca').should('be.visible');
    cy.get('input[type="text"]').then($el => {
      const text_btn=$el[2];
    cy.get(text_btn).type('NI');
    });
    //Verify validation message to add another member for revise status assignment
    cy.contains('No results found. Please add team members in the draft/submission manage page.').should('be.visible');
    cy.get('[data-test="showRecipientEmail"] > .v-input__control > .v-field > .v-field__append-inner > .mdi-menu-down').click();
    cy.get('label').contains('Notify all submitters').should('be.visible');
    cy.get('[data-test="canAttachCommentToEmail"] > .v-input__control > .v-selection-control > .v-label').click();
    cy.get('textarea[rows="1"]').type('some comments');
    cy.get('button').contains('REVISE').click();
    cy.get(':nth-child(1) > .v-checkbox > .v-input__control > .v-selection-control > .v-label').click();
    cy.wait(2000);
    //Verify Edit submission button is disabled
    cy.get('button[title="Edit This Submission"]').should('be.disabled');
    //Delete form after test run
    cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
    cy.waitForLoad();
    cy.get('.mdi-delete').click();
    cy.get('[data-test="continue-btn-continue"]').click();
    cy.get('#logoutButton > .v-btn__content > span').click();
    
    });
});
});