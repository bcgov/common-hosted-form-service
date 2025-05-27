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
// Update manage form settings
 it('Checks manage form settings', () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    cy.get('button').contains('Basic Fields').click();
    cy.get('div.formio-builder-form').then($el => {
      const coords = $el[0].getBoundingClientRect();
      cy.get('span.btn').contains('Text Field')
      
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -50, { force: true })
      .trigger('mouseup', { force: true });
      cy.get('button').contains('Save').click();
    });
  // Form saving
    let savedButton = cy.get('[data-cy=saveButton]');
    expect(savedButton).to.not.be.null;
    savedButton.should('be.visible').trigger('click');
    cy.wait(2000);
  // Filter the newly created form
    cy.location('search').then(search => {
      //let pathName = fullUrl.pathname
      let arr = search.split('=');
      let arrayValues = arr[1].split('&');
      cy.log(arrayValues[0]);
      //cy.log(arrayValues[1]);
      //cy.log(arrayValues[2]);
      cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
      cy.waitForLoad();
      })

    });  
    // Manage form settings
    it('Checks form scheduler settings', () => {
      cy.viewport(1000, 1100);
      cy.waitForLoad();
      cy.get(':nth-child(1) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay').click();
      cy.get('[lang="en"] > .v-btn > .v-btn__content > .mdi-pencil').click();
      cy.get('[data-test="text-description"]').clear();
      cy.get('[data-test="text-description"]').type('test description edit');
      cy.get('[data-test="canSaveAndEditDraftsCheckbox"]').click();
      //Verify form schedule settings is not present
      cy.get('span').contains('Form Schedule Settings').should('not.exist');
      //cy.get('span').contains('UPDATE').click();
      cy.get('.mb-5 > .v-btn--elevated').click();
      //Publish the form
      cy.get('[data-cy="formPublishedSwitch"] > .v-input__control > .v-selection-control > .v-label > span').click();
      cy.get('span').contains('Publish Version 1');

      cy.contains('Continue').should('be.visible');
      cy.contains('Continue').trigger('click');
      // Update Form settings after publish

      cy.get('[lang="en"] > .v-btn > .v-btn__content > .mdi-pencil').click();
      //Enable submission schedule and event subscription
      cy.contains('Form Submissions Schedule').click();
      cy.contains('Allow event subscription').click();
      cy.get(':nth-child(5) > .v-card > .v-card-text').should('be.visible');
      cy.get('input[placeholder="yyyy-mm-dd"]').click();
      // Select date for open submission
      cy.get('input[placeholder="yyyy-mm-dd"]').type('2026-06-17'); 
      //Checking the  schedule of closing date settings
      cy.contains('Schedule a closing date').click();
      cy.get('[data-test="closeSubmissionDateTime"]').should('be.visible');
      cy.get('[data-test="closeSubmissionDateTime"]').click();
      cy.get('[data-test="closeSubmissionDateTime"]').type('2026-09-17');
      cy.contains('Allow late submissions').click();
      cy.get('[data-test="afterCloseDateFor"]').should('be.visible');
      cy.get('[data-test="afterCloseDateFor"]').click();
      cy.get('[data-test="afterCloseDateFor"]').type('5');
      //Add time for open/close submission
      
      cy.get(':nth-child(1) > :nth-child(1) > :nth-child(2) > .v-input__control > .v-field').should('be.visible').click();
      cy.get(':nth-child(2) > .v-input__control > .v-field > .v-field__clearable > .mdi-close-circle').should('be.visible').click();
      cy.get('input[placeholder="Open time"]').type('09:00');
      cy.get(':nth-child(2) > .v-col-md-8 > .v-input > .v-input__control > .v-field > .v-field__clearable > .mdi-close-circle').click();
      cy.get('input[placeholder="Close time"]').type('17:00');
      cy.waitForLoad();
      cy.get('span[class="v-select__selection-text"]').contains('America/Vancouver').should('exist');
      //Verify all time zones present
      cy.get(':nth-child(1) > :nth-child(2) > .v-input > .v-input__control > .v-field > .v-field__append-inner > .mdi-menu-down').click();
      cy.get('div.v-list-item-title').contains('America/Atikokan').should('exist');
      cy.get('div.v-list-item-title').contains('America/Blanc-Sablon').should('exist');
      cy.get('div.v-list-item-title').contains('America/Cambridge_Bay').should('exist');
      cy.get('div.v-list-item-title').contains('America/Creston').should('exist');
      cy.get('div.v-list-item-title').contains('America/Dawson').should('exist');
      cy.get('div.v-list-item-title').contains('America/Dawson_Creek').should('exist');
      cy.get('div.v-list-item-title').contains('America/Edmonton').should('exist');
      cy.get('div.v-list-item-title').contains('America/Fort_Nelson').should('exist');
      cy.get('div.v-list-item-title').contains('America/Glace_Bay').should('exist');
      cy.get('div.v-list-item-title').contains('America/Goose_Bay').should('exist');
      cy.get('div.v-list-item-title').contains('America/Halifax').should('exist');
      cy.get('div.v-list-item-title').contains('America/Inuvik').should('exist');
      cy.get('div.v-list-item-title').contains('America/Iqaluit').should('exist');
      cy.get('div.v-list-item-title').contains('America/Moncton').should('exist');
      cy.get('div.v-list-item-title').contains('America/Phoenix').should('exist');
      cy.get('div.v-list-item-title').contains('America/Puerto_Rico').should('exist');
      cy.get('div.v-list-item-title').contains('America/Rankin_Inlet').should('exist');
      cy.get('div.v-list-item-title').contains('America/Panama').should('exist');
      cy.get('div.v-list-item-title').contains('America/Regina').should('exist');
      cy.get('div.v-list-item-title').contains('America/Resolute').should('exist');
      cy.get('div.v-list-item-title').contains('America/St_Johns').should('exist');
      cy.get('div.v-list-item-title').contains('America/Swift_Current').should('exist');
      cy.get('div.v-list-item-title').contains('America/Toronto').should('exist');
      cy.get('div.v-list-item-title').contains('America/Whitehorse').should('exist');
      cy.get('div.v-list-item-title').contains('America/Winnipeg').should('exist');
      cy.get(':nth-child(1) > :nth-child(2) > .v-input > .v-input__control > .v-field > .v-field__append-inner > .mdi-menu-down').click();
      cy.waitForLoad();
    //Verify amount of late submission
      cy.get('.pl-3 > :nth-child(2) > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
      cy.contains('weeks').click();
      
      //verification of Summary
      cy.contains('span','This form will be open for submissions from').should('be.visible');
      cy.get('b').then($el => {

        const rem=$el[0];
        const rem1=$el[1];
        cy.get(rem).contains('June 17, 2026 at 9:00 AM').should('exist');
        cy.get('span').contains(' to ').should('exist');
        cy.get(rem1).contains('September 17, 2026 at 5:00 PM').should('exist');

       });
       cy.get('span').contains(' allowing late submissions for 5 weeks.').should('exist');
      //Closing date for submission
      cy.contains('Set custom closing message').click();
      cy.get('textarea').then($el => {

        const rem=$el[0];
        cy.get(rem).type('closed for some reasons');
      });
      cy.contains('SEND Reminder email').click();
      cy.contains('SEND Reminder email').click();
    });
    it('Checks Event Stream settings', () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    cy.get(':nth-child(1) > .v-card > .v-card-text > .mb-6.font-weight-bold > .mdi-help-circle-outline').should('be.visible');
    //Validate help link
    cy.get('a.preview_info_link_field_white').then($el => {
      const ESS=$el[5];
      cy.get(ESS).should("have.attr","href","https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Integrations/Event-Stream-Service/");
    });
    //Add ESS name
    cy.get('input[type="text"]').then($el => {
      
      const ESS_name=$el[6];
      cy.get(ESS_name).click({ force: true });
      cy.get(ESS_name).type('ESS name');
      cy.get('[data-test="canEditForm"]').click();
      });
        
    });
    
    it('Checks Event Subscription settings', () => {
      cy.viewport(1000, 1100);
      cy.waitForLoad();
      cy.get(':nth-child(2) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay').click();
      cy.get('input[placeholder="https://endpoint.gov.bc.ca/api/v1/"]').click();
      cy.get('input[type="password"]').type('hi');
      
      cy.get('div').contains('Please enter a valid endpoint starting with https://').should('be.visible');
      cy.get('input[placeholder="https://endpoint.gov.bc.ca/api/v1/"]').type('https://endpoint.gov.bc.ca/');

      cy.get('.v-col > .v-btn > .v-btn__content > span').click();
      // Verify form settings updation success message
      cy.get('.v-alert__content').contains('div','Subscription settings for this form has been saved.').should('be.visible');
    });
    it('Checks External API settings', () => {
      cy.viewport(1000, 1100);
      cy.waitForLoad();
      
      cy.get(':nth-child(5) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay').click();
      cy.get('.mt-6 > :nth-child(2) > .mdi-help-circle-outline').should('exist');
      cy.get('.mdi-plus-circle').click({ force: true });
      cy.wait(2000);
      cy.get('input[type="text"]').then($el => {
        cy.get('.mdi-plus-circle').click();
        const api_name=$el[13];
        cy.get(api_name).click({ force: true });
        cy.get('[data-test="text-endpointUrl"]').click();
        
        cy.wait(2000);
        cy.contains('div','Name is required.').should('be.visible');
        cy.get('[data-test="text-apiKeyHeader"]').click();
        cy.get('.v-messages__message').contains('div','Please enter a valid endpoint starting with http:// or https://').should('be.visible');
        cy.get(api_name).click({ force: true });
        cy.get(api_name).type('chefs_name');
        cy.get('[data-test="text-endpointUrl"]').type('chefs_endpoint');
        //cy.contains('div','Name is required.').should('not.exist');
        cy.get('.v-messages__message').contains('div','Please enter a valid endpoint starting with http:// or https://').should('be.visible');
        cy.get('[data-test="text-endpointUrl"]').type('{selectall}{backspace}');
        cy.get('[data-test="text-endpointUrl"]').type('https://chefs-dev.apps.silver.devops.gov.bc.ca/');
        cy.get('[data-test="text-apiKeyHeader"]').type('header');
        cy.get('[data-test="text-apiKey"]').type('keyvalue');
      });
      cy.get('span').contains('Send API Key').click();
      cy.get('span').contains('Send User Information').click();
      cy.get('[data-test="continue-btn-continue"]').should('be.enabled');
      cy.get('[data-test="continue-btn-cancel"]').should('be.enabled');
      cy.get('[data-test="continue-btn-continue"]').click();
          
      cy.get('.v-data-table__tbody > .v-data-table__tr > :nth-child(3)').contains('Submitted');
      cy.get(':nth-child(1) > .v-btn > .v-btn__content > .mdi-pencil').click();
      cy.get('span').contains('Submitted').should('exist');
      cy.get('[data-test="continue-btn-continue"]').click();
      cy.get('.v-data-table__tbody > .v-data-table__tr > :nth-child(1)').should('have.text',"chefs_name");
        //Delete external api configuration
      cy.get('.v-data-table__tbody > .v-data-table__tr > .v-data-table-column--align-end > :nth-child(2) > [targetref="[object Object]"] > .v-btn').click(); 
      cy.wait(2000);
      cy.get('.v-data-table__tbody > .v-data-table__tr > :nth-child(1)').should('not.exist'); 
       //Delete form after test run
      cy.get('[data-test="canRemoveForm"]').then($el => {
      const delform=$el[0];
      cy.get(delform).click();
      })
      cy.get('[data-test="continue-btn-continue"] > .v-btn__content > span').then($el => {
      const delcontinue=$el[1];
      cy.get(delcontinue).click();
      cy.get('#logoutButton > .v-btn__content > span').click();
              
      });  
  
    });
});
