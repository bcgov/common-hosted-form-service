import 'cypress-keycloak-commands';
import 'cypress-drag-drop';

const depEnv = Cypress.env('depEnv');


Cypress.Commands.add('waitForLoad', () => {
  const loaderTimeout = 60000;

  cy.get('.nprogress-busy', { timeout: loaderTimeout }).should('not.exist');
});



describe('Form Designer', () => {

  beforeEach(()=>{
    
    cy.viewport(1000, 1800);
    cy.waitForLoad();
    cy.kcLogout();
    cy.kcLogin("user");
    
    cy.on('uncaught:exception', (err, runnable) => {
      // Form.io throws an uncaught exception for missing projectid
      // Cypress catches it as undefined: undefined so we can't get the text
      console.log(err);
      return false;
    });
  });
    
// Verifying fields in the form settings page
 it('Visits the form settings page', () => {
   
    cy.visit(`/${depEnv}/form/create`);
    cy.location('pathname').should('eq', `/${depEnv}/form/create`);
    cy.contains('h1', 'Form Settings');
    cy.get('.v-row > :nth-child(1) > .v-card > .v-card-title > span').contains('Form Title');

    let title="title" + Math.random().toString(16).slice(2);

    
    cy.get('#input-15').type(title);
    cy.get('#input-17').type('test description');
    cy.get('#input-22').click();
    cy.get('.v-selection-control-group > .v-card').should('be.visible');
    cy.get('#input-23').click();
    //cy.get('.v-selection-control-group > .v-card').should('not.be.visible');
    //cy.get('#input-91').should('be.visible');
    cy.get('.v-row > .v-input > .v-input__control > .v-selection-control-group > :nth-child(1) > .v-label > span').contains('IDIR');
    cy.get('span').contains('Basic BCeID');
    
    cy.get(':nth-child(2) > .v-card > .v-card-text > .v-input--error > :nth-child(2)').contains('Please select 1 log-in type');
    //cy.get('#input-92').should('be.visible');
    //cy.get('#input-93').should('be.visible');


    cy.get('#input-24').click();
    

    cy.get('#checkbox-25').click();
    cy.get('#checkbox-28').click();
    cy.get('#checkbox-38').click();
    cy.get('#checkbox-50').click();
    cy.get('#input-88').click();
    cy.get('#input-88').type('abc@gmail.com');
   
   
    
   cy.get('#input-54').click();
   cy.contains("Citizens' Services (CITZ)").click();
   
   cy.get('#input-58').click();

   
   cy.get('.v-list').should('contain','Applications that will be evaluated followed');
   cy.get('.v-list').should('contain','Collection of Datasets, data submission');
   cy.get('.v-list').should('contain','Registrations or Sign up - no evaluation');
   cy.get('.v-list').should('contain','Reporting usually on a repeating schedule or event driven like follow-ups');
   cy.get('.v-list').should('contain','Feedback Form to determine satisfaction, agreement, likelihood, or other qualitative questions');
   cy.contains('Reporting usually on a repeating schedule or event driven like follow-ups').click();
   cy.get('#input-64').click();
   cy.get('#input-70').click();
   cy.get('.mt-3 > .mdi-help-circle-outline').should('be.visible')
   cy.get('.mt-3 > .mdi-help-circle-outline').click();
   cy.get('.d-flex > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
   cy.get('.d-flex > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').type('test label');
   cy.get('#checkbox-76').click();
   cy.get('button').contains('Continue').click();

 
  // Form design page with simple textbox components

 
    let textFields = ["First Name", "Middle Name", "Last Name"];

    for(let i=0; i<textFields.length; i++) {
      cy.get('button').contains('Basic Fields').click();
      cy.get('div.formio-builder-form').then($el => {
      const bounds = $el[0].getBoundingClientRect();
      cy.get('span.btn').contains('Text Field')
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', bounds.x, -50, { force: true })
        .trigger('mouseup', { force: true });
        cy.get('p').contains('Text Field Component');
        cy.get('input[name="data[label]"]').clear().type(textFields[i]);
        cy.get('button').contains('Save').click();
      });
    }
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
      })
   
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
    });

  



  });
    
});