import { formsettings } from '../support/login.js';
import 'cypress-drag-drop';

const depEnv = Cypress.env('depEnv');
//const baseUrl=Cypress.e2e('baseUrl');


Cypress.Commands.add('waitForLoad', () => {
  const loaderTimeout = 60000;

  cy.get('.nprogress-busy', { timeout: loaderTimeout }).should('not.exist');
});
describe('Application About Page', () => {

 /* beforeEach(()=>{
      
    */
    cy.on('uncaught:exception', (err, runnable) => {
        // Form.io throws an uncaught exception for missing projectid
        // Cypress catches it as undefined: undefined so we can't get the text
        console.log(err);
        return false;
      });
       


  /*});
  //it('run first',() => {

    //formsettings();

  //})
  
*/it('Visits the app about page', () => {
  //cy.visit('https://chefs-dev.apps.silver.devops.gov.bc.ca/app/');
  cy.viewport(1000, 1800);
    cy.waitForLoad();
    formsettings();
    cy.get('button').contains('Advanced Fields').click();
    cy.waitForLoad();
    cy.waitForLoad();
    
    cy.get('div.formio-builder-form').then($el => {
      const coords = $el[0].getBoundingClientRect();
      cy.get('[data-type="simpletextareaadvanced"]')
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -400, { force: true })
        //.trigger('mousemove', coords.y, +100, { force: true })
      .trigger('mouseup', { force: true });
      //cy.get('input[name="data[customClass]"]').type('bg-primary');
      cy.waitForLoad();
        
      cy.get('button').contains('Save').click();


    });
    


 //cy.intercept('GET', `/${baseUrl}/api/v1/forms/*`).as('getForm');
 // Form saving
   let savedButton = cy.get('[data-cy=saveButton]');
   expect(savedButton).to.not.be.null;
   savedButton.trigger('click');
   cy.waitForLoad();

//user forms

  // let userFormsLinks = cy.get('[data-cy=userFormsLinks]');
    // expect(userFormsLinks).to.not.be.null;
    // userFormsLinks.trigger('click');
 
 // Filter the newly created form
 cy.waitForLoad();
 cy.waitForLoad();
 cy.location('search').then(search => {
 cy.log(search);
  //let pathName = fullUrl.pathname
   let arr = search.split('=');
  
   let arrayValues = arr[1].split('&');
   cy.log(arrayValues[0]);
  //
  //cy.log(arrayValues[2]);
  let dval=arr[2].split('&');
  cy.log(dval);
  cy.visit(`https://chefs-dev.apps.silver.devops.gov.bc.ca/app/form/preview?f=${arrayValues[0]}&d=${dval[0]}`);
  //cy.visit(`/form/preview?f=${arrayValues[0]}&d=${dval[0]}`);
  cy.waitForLoad();
  })
  
   

});

});