import 'cypress-keycloak-commands';
import 'cypress-drag-drop';
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
// Publish a simple form with Simplebc Address component
 it('Verify public form submission', () => {
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
    //Manage form
    cy.get(':nth-child(1) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay').click();
    cy.get('[lang="en"] > .v-btn > .v-btn__content > .mdi-pencil').click();
    cy.get('input[value="public"]').click();
    cy.waitForLoad();
    cy.get(':nth-child(3) > .v-card > .v-card-text > :nth-child(2) > .v-input__control > .v-selection-control > .v-label > span').click();//uncheck for not able to update the status of the form
    cy.get('input[type="checkbox"]').then($el => {
        const rem=$el[0];//save and edit drafts
        const rem2=$el[2];//multiple draft upload
        const rem3=$el[3];//form submission schedule settings
        const rem4=$el[4];//copy submission
        const rem5=$el[5];//event subscription
        cy.get(rem).should("not.be.enabled");
        cy.get(rem2).should("not.be.enabled");
        cy.get(rem3).should("be.enabled");
        cy.get(rem4).should("not.be.enabled");
        cy.get(rem5).should("be.enabled");
    });
    cy.get('[data-test="canEditForm"]').click();
    
    cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
    cy.wait(2000);
        //Logout to submit the public form
    cy.get('#logoutButton > .v-btn__content > span').click();
    //Form submission and verification for public forms
    cy.visit(`/${depEnv}/form/submit?f=${arrayValues[0]}`);
    cy.wait(2000);
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
    if(depEnv=="app")
          {
              cy.visit(`https://chefs-dev.apps.silver.devops.gov.bc.ca/app`);
          }
          else
          {
             
              cy.visit(`/${depEnv}`);
              
          }
          
    cy.get('[data-test="base-auth-btn"] > .v-btn > .v-btn__content > span').click();
    cy.get('[data-test="idir"]').click();
          
    cy.get('#user').type(username);
    cy.get('#password').type(password);
    cy.get('.btn').click();
    cy.wait(2000);
    //view submission
    cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
    cy.get('.mdi-list-box-outline').click();
    cy.wait(2000);
    cy.get(':nth-child(1) > :nth-child(6) > a > .v-btn > .v-btn__content > .mdi-eye').click();
    cy.waitForLoad();
    //Verify status option is not available for this
    cy.get('.status-heading > .mdi-chevron-right').should('not.exist');
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

});