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
  it('checks Apikey Settings', () => {
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

    // Verify Api key functionality
    cy.get('.mdi-cog').click();
    cy.get(':nth-child(2) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay').click();
    
    cy.get('[data-test="canGenerateAPIKey"]').click();
    cy.get('[data-test="continue-btn-continue"]').click();
    cy.get('[data-test="continue-btn-cancel"]').should('be.enabled');
    //cy.get('.mx-2').click();
    cy.get('[data-test="canAllowCopyAPIKey"]').click();
    //Verify checkbox checked for access submitted files
    cy.contains('Allow this API key to access submitted files').click();
    cy.get('input[aria-label="Allow this API key to access submitted files"]').should('be.checked');
    //Delete Apikey
    cy.get('[data-test="canDeleteApiKey"]')


  })
  it('checks Cdogs Upload', () => {



  })

})

