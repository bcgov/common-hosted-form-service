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
 it('Checks Export/Import design functionality', () => {
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

    cy.get('.mdi-publish').click();
    let fileUploadInputField = cy.get('input[type=file]');
    cy.get('input[type=file]').should('not.to.be.null');
    fileUploadInputField.attachFile('test_schema.json');
    cy.wait(2000);
    cy.get('input[name="data[simplebcaddress]"]').should('not.exist'); 
    
    cy.get('.mdi-download').click();
    cy.wait(2000);
    //Verifies design downloads into download folder
    cy.get("h3").then(($elem) => {
        const rem = $elem.text();
        let arr = rem.split(':');

        cy.log(arr);
        let remname = arr[1] + "_schema.json";
        cy.wait(2000);
        const path = require("path");
        const downloadsFolder=Cypress.config("downloadsFolder");
        cy.readFile(path.join(downloadsFolder,remname)).should('exist');

    });
    //Verify visibility of right side buttons on design page
    cy.get('[data-cy="saveButton"] > .v-btn').should('be.enabled');
    //cy.get('[data-cy="previewRouterLink"] > .v-btn').should('be.enabled');
    cy.get('[data-cy="undoButton"] > .v-btn').should('be.enabled');
    cy.get('[data-cy="redoButton"] > .v-btn').should('not.be.enabled');
    cy.get('.mdi-undo').click();
    cy.get('[data-cy="redoButton"] > .v-btn').should('be.enabled');
    cy.get('[data-cy="redoButton"] > .v-btn').click();
    cy.get('.float-button > :nth-child(1) > .v-btn').should('be.enabled');
    cy.get('.float-button > :nth-child(1) > .v-btn').click();
    cy.get('.mdi-arrow-down').should('not.exist');

    cy.get('.mdi-arrow-up').should('exist');
    cy.get('.mdi-close').click();
    cy.get('[data-cy="saveButton"] > .v-btn').should('not.exist');
    cy.get('.mdi-undo').should('not.exist');
    cy.get('.mdi-redo').should('not.exist');
    cy.get('.mdi-menu').should('be.visible');
    cy.get('.mdi-arrow-up').should('be.visible');
    cy.get('.mdi-menu').click();
    

    // Form saving
    let savedButton = cy.get('[data-cy=saveButton]');
    expect(savedButton).to.not.be.null;
    savedButton.trigger('click');
    cy.wait(2000);
    //cy.get('[data-cy="previewRouterLink"] > .v-btn').should('be.enabled');
    
    // Filter the newly created form
    cy.location('search').then(search => {
    let arr = search.split('=');
    let arrayValues = arr[1].split('&');
    cy.log(arrayValues[0]);
    let dval=arr[2].split('&');
    cy.log(dval);
         //Form preview
    cy.visit(`/${depEnv}/form/preview?f=${arrayValues[0]}&d=${dval[0]}`);
    cy.waitForLoad();
    //Verify new design is updated in the form
    cy.get('label').contains('Select List').should('be.visible');

    //Delete form after test run
    cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
     cy.waitForLoad();
    cy.get('[data-test="canRemoveForm"]').click();
    cy.get('[data-test="continue-btn-continue"]').click();
    cy.get('#logoutButton > .v-btn__content > span').click();
    });
    
    
    
});


});