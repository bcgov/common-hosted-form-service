import 'cypress-drag-drop';
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
    
    cy.get('button').contains('BC Government').click();
    cy.get('div.formio-builder-form').then($el => {
      const coords = $el[0].getBoundingClientRect();
      cy.get('[data-key="simplebcaddress"]')
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -550, { force: true })
      .trigger('mouseup', { force: true });
      cy.waitForLoad();
      //cy.get('input[name="data[label]"]').type('s');  
      cy.get('button').contains('Save').click();
      //cy.get('.btn-success').click();


    });
    cy.intercept('GET', `/${depEnv}/api/v1/forms/*`).as('getForm');
  // Form saving
    
    cy.get('[data-cy=saveButton]').click();
    cy.waitForLoad();


  // Go to My forms  
    cy.wait('@getForm').then(()=>{
      let userFormsLinks = cy.get('[data-cy=userFormsLinks]');
      expect(userFormsLinks).to.not.be.null;
      userFormsLinks.trigger('click');
    });
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

      cy.get('.pl-3 > :nth-child(2) > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
      cy.contains('weeks').click();
      //Set Up submission period
      cy.contains('Set up submission period').click();
      cy.get('[data-test="closeSubmissionDateTime"]').should('not.exist');
      cy.get('[data-test="afterCloseDateFor"]').should('not.exist');
      cy.waitForLoad();
      cy.get('input[type="number"]').then($el => {

        const rem=$el[0];
        rem.click();
        cy.get(':nth-child(4) > .v-input > .v-input__control > .v-field').click();
        cy.contains('div','This field is required.').should('be.visible');
        cy.get(rem).type('5');
        
        });
      cy.get(':nth-child(4) > .v-input > .v-input__control > .v-field').click();
      cy.wait(4000);
      cy.contains('days').click();
      //verification of Summary
      cy.contains('span','This form will be open for submissions from').should('be.visible');
      cy.get('b').then($el => {

        const rem=$el[0];
        const rem1=$el[1];
        cy.get(rem).contains('2026-06-17').should('exist');

       });
      //Repeat period
      cy.contains('Repeat period').click();
      cy.get('input[type="number"]').then($el => {

        const rem=$el[1];
        cy.get(rem).type('6');
        
        });
      
      cy.get(':nth-child(4) > :nth-child(2) > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
      cy.contains('quarters').click();
      cy.get('input[type="date"]').then($el => {

        const rem=$el[1];
        rem.click();
        //checking validation message
        
        cy.get(rem).type('2026-12-17');
        
        });
 
      //Closing date for submission
      cy.contains('Set custom closing message').click();
      cy.get('textarea').then($el => {

        const rem=$el[0];
        cy.get(rem).type('closed for some reasons');
      });
      //cy.get('textarea').type('closed for some reasons')
      cy.contains('SEND Reminder email').click();
      
      cy.contains('SEND Reminder email').click();
      cy.get('[data-test="canEditForm"]').click();
    })
    it('Checks Event Subscription settings', () => {
      cy.viewport(1000, 1100);
      cy.waitForLoad();
      cy.get(':nth-child(2) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay').click();
      cy.get('input[placeholder="https://endpoint.gov.bc.ca/api/v1/"]').click();
        
      cy.get('input[type="text"]').then($el => {

        const rem=$el[10];
        cy.get(rem).type('7');
        
        });
      
      cy.get('input[type="password"]').type('hi');
      
      cy.get('div').contains('Please enter a valid endpoint starting with https://').should('be.visible');
      cy.get('input[placeholder="https://endpoint.gov.bc.ca/api/v1/"]').type('https://endpoint.gov.bc.ca/');

      cy.get('.v-col > .v-btn > .v-btn__content > span').click();
      // Verify form settings updation success message
      cy.get('.v-alert__content').contains('div','Subscription settings for this form has been saved.').should('be.visible');
    })
    it('Checks External API settings', () => {
      cy.viewport(1000, 1100);
      cy.waitForLoad();
      cy.get(':nth-child(5) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay').click();
      cy.get('.mt-6 > :nth-child(2) > .mdi-help-circle-outline').should('exist');
      cy.get('.mdi-plus-circle').click({ force: true });
      cy.wait(2000);
      cy.get('input[type="text"]').then($el => {
        cy.get('.mdi-plus-circle').click();

        const api_name=$el[12];
        const api_endpoint=$el[13];
        const api_header=$el[14];
        const api_keyvalue=$el[15];
        cy.get(api_name).click();
        cy.get(api_endpoint).click();
        
        cy.wait(2000);
        cy.get(api_header).click();
        cy.contains('div','Name is required.').should('be.visible');
        cy.get('.v-messages__message').contains('div','Please enter a valid endpoint starting with http:// or https://').should('be.visible');

        cy.get(api_name).type('chefs_name');
        cy.get(api_endpoint).type('chefs_endpoint');
        cy.contains('div','Name is required.').should('not.exist');
        cy.get('.v-messages__message').contains('div','Please enter a valid endpoint starting with http:// or https://').should('be.visible');
        cy.get(api_endpoint).type('{selectall}{backspace}');
        cy.get(api_endpoint).type('https://chefs-dev.apps.silver.devops.gov.bc.ca/');
        cy.get(api_header).type('header');
        cy.get(api_keyvalue).type('keyvalue');
      });
      cy.get('input[type="checkbox"]').then($el => {
          const user_apikey=$el[14];
          const user_info=$el[15];
          cy.get(user_info).click();
          cy.get(user_apikey).click();
          cy.get('[data-test="continue-btn-continue"]').should('be.enabled');
          cy.get('[data-test="continue-btn-cancel"]').should('be.enabled');
          cy.get('[data-test="continue-btn-continue"]').click();
      })
          
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
            
       
          
      })  
  
    })
})