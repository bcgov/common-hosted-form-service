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
// Publish a simple form 
it('Verify draft submission', () => {
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
    cy.get('div > .bg-primary').click();
    cy.get('.v-data-table__tr > :nth-child(4)').contains('DRAFT');
    //Verify draft delete button exist
    cy.get('[icon-size="x-small"] > .v-btn').should('be.exist');
    //View column management
    cy.get('.mdi-view-column').click();
    cy.get('[data-test="filter-search"]').type('Status');
    //Remove Status column from draft submission table
    cy.get('input[type="checkbox"]').then($el => {

      const rem=$el[1];
      cy.get(rem).click();

    });
    //Verify Status column is removed from submission table
    cy.get('[data-test="save-btn"] > .v-btn__content').click();
    cy.get('.v-data-table__tr > :nth-child(4)').contains('DRAFT').should('not.exist');
    cy.get('.mdi-pencil').click();
    cy.get('.mdi-content-save').click();
    cy.get('.v-alert__content > div').contains('Draft Saved');
    // Edit draft submission
    cy.wait(4000);
    cy.get('.mt-6 > :nth-child(1) > .v-btn > .v-btn__content > span').click();
    cy.get('.mdi-pencil').click();
    cy.waitForLoad();
    //Form submission
    cy.contains('Text Field').click();
    cy.contains('Text Field').type('{selectall}{backspace}');
    cy.contains('Text Field').type('Nancy');
    cy.get('button').contains('Submit').click();
    cy.waitForLoad();
    cy.get('[data-test="continue-btn-continue"]').click({force: true});
    cy.waitForLoad();
    cy.location('pathname').should('eq', `/${depEnv}/form/success`);
    cy.contains('h1', 'Your form has been submitted successfully');
    cy.get('.mt-6 > :nth-child(1) > .v-btn > .v-btn__content > span').click();
    //cy.get('div > .bg-primary').click();
    cy.get('.v-data-table__tr > :nth-child(4)').contains('SUBMITTED').should('not.exist');
    //Delete form after test run
    cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
    cy.waitForLoad();
    cy.get('.mdi-delete').click();
    cy.get('[data-test="continue-btn-continue"]').click();
    cy.get('#logoutButton > .v-btn__content > span').click();
   

    });

  });
    
});