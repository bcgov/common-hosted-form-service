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
// Publish a simple form with Simplebc Address component
 it('Checks team management', () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    
    cy.get('button').contains('BC Government').click();
    cy.get('div.formio-builder-form').then($el => {
      const coords = $el[0].getBoundingClientRect();
      cy.get('[data-key="simplebcaddress"]')
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -550, { force: true })
        //.trigger('mousemove', coords.y, +100, { force: true })
      .trigger('mouseup', { force: true });
      cy.waitForLoad();
      //cy.get('input[name="data[label]"]').type('s');  
      cy.get('button').contains('Save').click();
      //cy.get('.btn-success').click();


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
      })
   
    //Go to Team Management

    cy.get('.mdi-account-multiple').click();
    cy.get('.mdi-account-plus').click();
    //Search for a member to add
    cy.get('.v-col > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.get('.v-col > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').type('NIM');
    cy.get(':nth-child(2) > .v-chip__content').should('be.visible');
    cy.get(':nth-child(4) > .v-chip__content').should('be.visible');
    cy.get(':nth-child(5) > .v-chip__content').should('be.visible');
    cy.contains('John, Nimya 1 CITZ:EX (nimya.1.john@gov.bc.ca)').click();
    cy.get(':nth-child(2) > .v-chip__content').click();
    cy.get(':nth-child(4) > .v-chip__content').click();
    cy.get(':nth-child(5) > .v-chip__content').click();
    cy.get('.v-btn--elevated > .v-btn__content > span').click();
    // Verify member is added with proper roles
    cy.get('#input-89').should('be.checked');
    cy.get('#input-90').should('be.checked');
    cy.get('#input-91').should('be.checked');
    cy.get('#input-93').should('be.checked');
    //Manage column views
    cy.get('.mdi-view-column').click();
    cy.get('#input-121').should('be.checked');
    cy.get('#input-122').should('be.checked');
    cy.get('#input-123').should('be.checked');
    cy.get('#input-124').should('be.checked');
    
    cy.get('#input-121').click();
    cy.waitForLoad();
    cy.get('#input-121').should('not.be.checked');
    //Column view management
    cy.get('#input-113').click();
    cy.get('#input-113').type('Designer');

    cy.get('#input-125').click();
    cy.get('button').contains('Save').click();
    cy.waitForLoad();
    //Verify the roles on dashboard
    cy.get('#input-137').should('not.exist');
    cy.get('#input-149').should('not.be.checked');

    //Remove a user from Roles
    cy.get('tbody > :nth-child(1) > [style="width: 1rem;"] > .v-btn').click();
    cy.waitForLoad();
    //cy.contains('REMOVE').click();
    cy.get('[data-test="continue-btn-continue"] > .v-btn__content > span').click();
    cy.waitForLoad();
    cy.contains('NIMJOHN').should('not.exist');
    //cy.get('.v-data-table__tr > [style="width: 1rem;"] > .v-btn').click();
    //cy.get('[data-test="continue-btn-continue"] > .v-btn__content > span').should('not.exist');



 });

 it('Checks team management after form publish', () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    
    
    cy.location('search').then(search => {
      //let pathName = fullUrl.pathname
      let arr = search.split('=');
      let arrayValues = arr[1].split('&');
      cy.log(arrayValues[0]);
      //cy.log(arrayValues[1]);
      //cy.log(arrayValues[2]);
      cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
      cy.waitForLoad();
      cy.log(arrayValues[0]);
      })


      //cy.get('.mdi-cog').click();
    //Publish the form
    cy.get('.v-label > span').click();

    cy.get('span').contains('Publish Version 1');

    cy.contains('Continue').should('be.visible');
    cy.contains('Continue').trigger('click');


    cy.get('.mdi-account-multiple').click();
    cy.get('.mdi-account-plus').click();
    //Search for a member to add
    cy.get('.v-col > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.get('.v-col > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').type('NIM');
    cy.get(':nth-child(2) > .v-chip__content').should('be.visible');
    cy.get(':nth-child(4) > .v-chip__content').should('be.visible');
    cy.get(':nth-child(5) > .v-chip__content').should('be.visible');
    cy.contains('John, Nimya 1 CITZ:EX (nimya.1.john@gov.bc.ca)').click();
    cy.get(':nth-child(2) > .v-chip__content').click();
    cy.get(':nth-child(4) > .v-chip__content').click();
    cy.get(':nth-child(5) > .v-chip__content').click();
    cy.get('.v-btn--elevated > .v-btn__content > span').click();
    cy.waitForLoad();




    // Verify Roles on submission data
    cy.location('search').then(search => {
      //let pathName = fullUrl.pathname
      let arr = search.split('=');
      //let arrayValues = arr[1].split('&');
      
      cy.visit(`/${depEnv}/form/submit?f=${arr[1]}`);
      cy.log(arr[1]);
      
    
    
    
    
     // form submission
     cy.get('input[name="data[simplebcaddress]"').click();
     cy.get('input[name="data[simplebcaddress]"').type('2260 Sooke');
     cy.waitForLoad();
     cy.get('button').contains('Submit').click();
     cy.waitForLoad();
     cy.waitForLoad();
     //cy.get('button').contains('Submit').click();
     
     //cy.get('button').contains('Submit').click();
     cy.get('[data-test="continue-btn-continue"]').click();
     cy.waitForLoad();
     cy.waitForLoad();
     
      
    
    
    //Go to Team Management

    
      //let arrayValues1 =  arr;
      cy.visit(`/${depEnv}`);
      cy.get('[data-cy="userFormsLinks"]').click();
      cy.visit(`/${depEnv}/form/manage?f=${arr[1]}`);
      cy.waitForLoad();
      cy.log(arr[1]);
     })
   
    cy.get('.mdi-list-box-outline').click();
    cy.get(':nth-child(1) > :nth-child(6) > a > .v-btn').click();
    //cy.get('.mdi-pencil').should('be.enabled');
    cy.get('[aria-describedby="v-tooltip-82"]').should('be.enabled');
    cy.get('.mdi-pencil').click();
    cy.get('button').contains('Submit').click();
    cy.waitForLoad();
    cy.get('button').contains('Submit').click();
    cy.waitForLoad();

    //Delete submission after test run
    //cy.get('a > .v-btn').click();
    cy.get('.mdi-delete').click();
    cy.get('[data-test="continue-btn-continue"]').click();
    








    

    

  



     });
    
});