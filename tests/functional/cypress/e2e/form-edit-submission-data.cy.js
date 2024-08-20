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
    let textFields = ["First Name", "Middle Name", "Last Name"];

    for(let i=0; i<textFields.length; i++) {
      cy.get('button').contains('Basic Fields').click();
      cy.get('div.formio-builder-form').then($el => {
      const bounds = $el[0].getBoundingClientRect();
      cy.get('span.btn').contains('Text Field')
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', bounds.x, -100, { force: true })
        .trigger('mouseup', { force: true });
        cy.get('p').contains('Text Field Component');
        cy.get('input[name="data[label]"]').clear();
        cy.get('input[name="data[label]"]').clear();
        cy.get('input[name="data[label]"]').type(textFields[i]);
        cy.get('button').contains('Save').click();
      });
    }
 

    });
    it('Form Submission and Updation', () => {
        cy.viewport(1000, 1100);
        cy.waitForLoad();
        cy.waitForLoad();
        cy.get('div.formio-builder-form').then($el => {
            const coords2 = $el[0].getBoundingClientRect();
            cy.get('span.btn').contains('Checkbox')
            
            .trigger('mousedown', { which: 1}, { force: true })
            .trigger('mousemove', coords2.x, -50, { force: true })
            .trigger('mouseup', { force: true });
            cy.get('p').contains('Checkbox Component');
            cy.get('input[name="data[label]"]').clear();
            cy.get('input[name="data[label]"]').clear();
            cy.get('input[name="data[label]"]').type('Applying for self');
            cy.get('button').contains('Save').click();
        });
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
            //cy.log(arrayValues[1]);
            //cy.log(arrayValues[2]);
            cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
            cy.waitForLoad();
        
         
          //Publish the form
        cy.get('.v-label > span').click();
      
        cy.get('span').contains('Publish Version 1');
      
        cy.contains('Continue').should('be.visible');
        cy.contains('Continue').trigger('click');
        //Submit the form
        cy.visit(`/${depEnv}/form/submit?f=${arrayValues[0]}`);
        cy.waitForLoad();
        cy.waitForLoad();
        cy.waitForLoad();
        cy.get('button').contains('Submit').should('be.visible');
        cy.waitForLoad();
        cy.waitForLoad();
        cy.get('input[name="data[simpletextfield1]"').click();
        cy.get('input[name="data[simpletextfield1]"').type('Alex');
        cy.get('input[name="data[simpletextfield2]"').click();
        cy.get('input[name="data[simpletextfield2]"').type('Smith');
        //cy.get('.form-check-input').click();
         //form submission
        cy.get('button').contains('Submit').click();
        cy.waitForLoad();
        cy.get('button').contains('Submit').click();
        cy.waitForLoad();
        cy.get('button').contains('Submit').click();
        cy.waitForLoad();
        cy.waitForLoad();
        cy.waitForLoad();
        cy.get('label').contains('First Name').should('be.visible');
        cy.get('label').contains('Last Name').should('be.visible');
        cy.get('label').contains('Applying for self').should('be.visible');
        
        
        //Update submission
        cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
        cy.waitForLoad();
        cy.waitForLoad();
        cy.visit(`/${depEnv}/form/submit?f=${arrayValues[0]}`);
        cy.waitForLoad();
        cy.waitForLoad();
        cy.waitForLoad();
        cy.get('button').contains('Submit').should('be.visible');
        cy.get('input[name="data[simpletextfield1]"').click();
        cy.get('input[name="data[simpletextfield1]"').type('Alex');
        cy.get('input[name="data[simpletextfield2]"').click();
        cy.get('input[name="data[simpletextfield2]"').type('Smith');
        cy.get('button').contains('Submit').click();
        cy.waitForLoad();
        cy.get('button').contains('Submit').click();
        cy.get('[data-test="continue-btn-continue"]').click();
        cy.get('label').contains('First Name').should('be.visible');
        cy.get('label').contains('Last Name').should('be.visible');
        cy.get('label').contains('Applying for self').should('be.visible')
        //view submission
        cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
        cy.waitForLoad();
        cy.waitForLoad();
        
        cy.get('.mdi-list-box-outline').click();
        cy.waitForLoad();
        cy.get(':nth-child(1) > :nth-child(6) > a > .v-btn > .v-btn__content > .mdi-eye').click();
        //Edit submission
        cy.get('.mdi-pencil').click();
        //check visibility of cancel button
        cy.get('.v-col-2 > .v-btn').should('be.visible');
        cy.get('button').contains('Submit').should('be.visible');
        
        //Edit submission data
        cy.get('input[name="data[simpletextfield1]"').click();
        cy.get('input[name="data[simpletextfield1]"').clear();
        cy.get('input[name="data[simpletextfield1]"').type('Nancy');
        cy.get('input[name="data[simpletextfield2]"').click();
        cy.get('input[name="data[simpletextfield2]"').type('Smith');
        cy.get('button').contains('Submit').click();
        cy.waitForLoad();
        cy.get('[data-test="continue-btn-continue"]').click();
        cy.waitForLoad();
        cy.waitForLoad();
        cy.get('label').contains('First Name').should('be.visible');
        cy.get('label').contains('Last Name').should('be.visible');
        //Adding notes to submission
        cy.get('.mdi-plus').click();
        cy.get('div').find('textarea').then($el => {

          const rem=$el[0];
          rem.click();
          cy.get(rem).type('some notes');
          
          
          });
        cy.get('[data-test="canCancelNote"]').should('be.visible');
        cy.get('[data-test="btn-add-note"]').click();
        cy.get('.notes-text').contains('1');
        //Delete form after test run
        cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
        cy.waitForLoad();
        cy.waitForLoad();
        cy.get('.mdi-delete').click();
        cy.get('[data-test="continue-btn-continue"]').click();
        cy.get('#logoutButton > .v-btn__content > span').click();
        
        
        })

        
    });

});