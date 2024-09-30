import 'cypress-keycloak-commands';
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
    it('Add some fields for submission', () => {

    cy.viewport(1000, 1800);
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
    
    });

    it('Form Submission and Updation', () => {
        cy.viewport(1000, 1100);
        cy.wait(4000);
        cy.intercept('GET', `/${depEnv}/api/v1/forms/*`).as('getForm');
        // Form saving
        let savedButton = cy.get('[data-cy=saveButton]');
        expect(savedButton).to.not.be.null;
        savedButton.trigger('click');
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
        cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
        cy.waitForLoad();
        //Publish the form
        cy.get('.v-label > span').click();
      
        cy.get('span').contains('Publish Version 1');
      
        cy.contains('Continue').should('be.visible');
        cy.contains('Continue').trigger('click');
        //Submit the form
        cy.visit(`/${depEnv}/form/submit?f=${arrayValues[0]}`);
        cy.wait(4000);
        cy.get('button').contains('Submit').should('be.visible');
        cy.waitForLoad();
        cy.contains('Text Field').click();
        cy.contains('Text Field').type('Alex');
        //cy.get('.form-check-input').click();
         //form submission
        cy.get('button').contains('Submit').click();
        cy.waitForLoad();
        cy.get('button').contains('Submit').click();
        cy.wait(4000);
        cy.get('label').contains('Text Field').should('be.visible');
        cy.get('label').contains('Text Field').should('be.visible');
        cy.location('pathname').should('eq', `/${depEnv}/form/success`);
        cy.contains('h1', 'Your form has been submitted successfully');
        cy.wait(4000);
        //Update submission
        cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
        cy.wait(4000);
        cy.visit(`/${depEnv}/form/submit?f=${arrayValues[0]}`);
        cy.wait(4000);
        cy.get('button').contains('Submit').should('be.visible');
        cy.contains('Text Field').click();
        cy.contains('Text Field').type('Smith');
        cy.get('button').contains('Submit').click();
        cy.waitForLoad();
        cy.get('button').contains('Submit').click();
        //cy.get('[data-test="continue-btn-continue"]').click();
        cy.get('label').contains('Text Field').should('be.visible');
        //cy.get('label').contains('Applying for self').should('be.visible');
        cy.location('pathname').should('eq', `/${depEnv}/form/success`);
        cy.contains('h1', 'Your form has been submitted successfully');
        cy.wait(4000);
        cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
        cy.wait(4000);
        cy.get('.mdi-list-box-outline').click();
        cy.waitForLoad();
        //Verify pagination for submission
        cy.get('div').contains('1-2 of 2').should('be.visible');
        cy.get('.v-select__selection-text').contains('10');
        cy.get('.v-data-table-footer__items-per-page > .v-input > .v-input__control > .v-field > .v-field__append-inner > .mdi-menu-down').click();
        cy.contains('20').should('be.visible');
        cy.contains('25').should('be.visible');
        cy.contains('50').should('be.visible');
        cy.contains('All').should('be.visible');
        cy.get('button[title="Delete Submission"]').should('be.visible');
         //view submission
        cy.get(':nth-child(1) > :nth-child(6) > a > .v-btn > .v-btn__content > .mdi-eye').click();
        cy.wait(4000);
        })

    });
    it('Submission status Assignment', () => {
        cy.viewport(1000, 1100);
        cy.wait(4000);
        //Assign status submission
        cy.get('.status-heading > .mdi-chevron-right').click();
        cy.get('[data-test="showStatusList"] > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
        cy.contains('ASSIGNED').click();
        cy.get('[data-test="canAssignToMe"] > .v-btn__content > span').should('be.visible');
        cy.get('[data-test="showAssigneeList"] > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
        cy.get('[data-test="showAssigneeList"] > .v-input__control > .v-field > .v-field__field > .v-field__input').type('ch');
        cy.get('div').contains('CHEFS Testing').click();
        cy.get('[data-test="updateStatusToNew"] > .v-btn__content > span').click();
        cy.wait(4000);
        //cy.get('[data-test="showStatusList"] > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
        cy.get('[data-test="showStatusList"] > .v-input__control > .v-field > .v-field__append-inner > .mdi-menu-down').click();
        cy.contains('REVISING').click();
        //cy.get('.v-selection-control > .v-label').click();
        cy.get('[data-test="canAttachCommentToEmail"] > .v-input__control > .v-selection-control > .v-label').click();
        cy.get('textarea[rows="1"]').type('some comments');
        cy.get('button').contains('REVISE').click();
        cy.get(':nth-child(1) > .v-checkbox > .v-input__control > .v-selection-control > .v-label').click();
        cy.wait(4000);
        
        //Verify Edit submission button is disabled
        cy.get('button[title="Edit This Submission"]').should('be.disabled');
        //Verify Submission edit users history
        cy.get('.mdi-history').click();
        cy.get('.v-data-table__tr > :nth-child(1)').contains('CHEFSTST@idir');
        cy.get('.v-card-actions > .v-btn').click();

        //Verify History for status updation
        cy.get('[data-test="viewHistoryButton"]').click();
        cy.get('[data-test="canCloseStatusPanel"] > .v-btn__content > span').click();
        cy.get('[data-test="showStatusList"] > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
        cy.contains('COMPLETED').click();
        cy.get('button').contains('COMPLETE').click();
        cy.get('[data-test="viewHistoryButton"]').click();
        cy.get('tbody > :nth-child(1) > :nth-child(1)').contains('COMPLETED');
        cy.get('tbody > :nth-child(2) > :nth-child(1)').contains('REVISING');
        cy.get('tbody > :nth-child(3) > :nth-child(1)').contains('ASSIGNED');
        cy.get('tbody > :nth-child(4) > :nth-child(1)').contains('SUBMITTED');
        cy.get('[data-test="canCloseStatusPanel"] > .v-btn__content > span').click();
        cy.get('.mdi-list-box-outline').click();
        cy.waitForLoad();
        cy.location('search').then(search => {
          //let pathName = fullUrl.pathname
        let arr = search.split('=');
        cy.visit(`/${depEnv}/form/manage?f=${arr[1]}`);
        cy.waitForLoad();
        // Checks copy submission button enabled for user
        cy.visit(`/${depEnv}/user/submissions?f=${arr[1]}`);
        
        cy.get('.v-data-table-column--align-end > .d-flex > :nth-child(2) > a > .v-btn');
        cy.get('.mdi-pencil-box-multiple');
        
       //Delete Submission
        cy.visit(`/${depEnv}/form/manage?f=${arr[1]}`);
        cy.waitForLoad();
        cy.waitForLoad();
        cy.get('.mdi-list-box-outline').click();
        cy.get('button[title="Delete Submission"]').then($el => {

          const rem=$el[0];
          rem.click();
          
        });
        cy.get('[data-test="continue-btn-continue"] > .v-btn__content > span').click();
        cy.get('.v-data-table__tbody > :nth-child(2) > :nth-child(2)').should('not.exist');
        
        //Delete form after test run
        cy.visit(`/${depEnv}/form/manage?f=${arr[1]}`);
        cy.wait(4000);
        cy.get('.mdi-delete').click();
        cy.get('[data-test="continue-btn-continue"]').click();
        cy.get('#logoutButton > .v-btn__content > span').click();
        })
           
    });

});