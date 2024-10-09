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
    cy.get(':nth-child(1) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay').click();
    cy.get('[lang="en"] > .v-btn > .v-btn__content > .mdi-pencil').click();
    cy.get('input[value="public"]').click();
    cy.waitForLoad();
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
    //Check team management functionality for public forms
    
    cy.get('.mdi-account-multiple').click();
    cy.get('.mdi-account-plus').click();
    //Search for a member to add
    cy.get('.v-col > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.get('.v-col > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').type('NIM');
    cy.get('.v-slide-group__content > :nth-child(1)').should('be.visible')//designer role
    cy.get(':nth-child(2) > .v-chip__content').should('be.visible');//submitter role
    cy.get(':nth-child(3) > .v-chip__content').should('be.visible');//owner role
    cy.get(':nth-child(4) > .v-chip__content').should('be.visible');//approver role
    cy.get(':nth-child(5) > .v-chip__content').should('be.visible');//reviewer role
    cy.get(':nth-child(6) > .v-chip__content').should('be.visible');//team manager role
    cy.contains('John, Nimya 1 CITZ:EX (nimya.1.john@gov.bc.ca)').click();
    cy.get(':nth-child(2) > .v-chip__content').click();
    cy.get(':nth-child(4) > .v-chip__content').click();
    cy.get(':nth-child(5) > .v-chip__content').click();
    cy.get('.v-btn--elevated > .v-btn__content > span').click();
    cy.get(':nth-child(10) > span').should('not.exist');// verify Submitter role is not present on table view
    // Verify member is added with proper roles
    cy.get('[data-test="ApproverRoleCheckbox"]').should('be.visible');
    cy.get('[data-test="ReviewerRoleCheckbox"]').should('exist');
    cy.get('[data-test="TeamManagerRoleCheckbox"]').should('be.visible');
    cy.get('[data-test="ApproverRoleCheckbox"]').click({multiple:true,force:true});
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
    cy.waitForLoad();
    cy.get(':nth-child(1) > :nth-child(6) > a > .v-btn > .v-btn__content > .mdi-eye').click();

    });
    //Assign status submission
    cy.get('.status-heading > .mdi-chevron-right').click();
    cy.get('[data-test="showStatusList"] > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.contains('ASSIGNED').should('be.visible');
    cy.contains('REVISED').should('not.exist');
    cy.contains('COMPLETED').should('be.visible');
    cy.contains('ASSIGNED').click();
    cy.get('[data-test="canAssignToMe"] > .v-btn__content > span').should('be.visible');
    cy.get('[data-test="showAssigneeList"] > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.get('[data-test="showAssigneeList"] > .v-input__control > .v-field > .v-field__field > .v-field__input').type('ch');
    cy.get('div').contains('CHEFS Testing').click();
    cy.get('[data-test="updateStatusToNew"] > .v-btn__content > span').click();
    cy.waitForLoad();
    cy.waitForLoad();
    cy.get('[data-test="showStatusList"] > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.contains('COMPLETED').click();
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