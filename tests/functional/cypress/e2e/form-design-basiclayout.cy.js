
import 'cypress-keycloak-commands';
import 'cypress-drag-drop';

const depEnv = Cypress.env('depEnv');


Cypress.Commands.add('waitForLoad', () => {
  const loaderTimeout = 60000;

  cy.get('.nprogress-busy', { timeout: loaderTimeout }).should('not.exist');
});



describe('Form Designer', () => {

  beforeEach(()=>{
    
    cy.viewport(1000, 1100);
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
  


it('Visits the form design page for basic layout', () => {

    cy.visit(`/${depEnv}/form/create`);
    cy.location('pathname').should('eq', `/${depEnv}/form/create`);
    //cy.contains('h1', 'Form Settings');
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

  cy.get('button').contains('Basic Layout').click();

//cy.get('#heading-layoutControls > .mb-0 > .btn').click();
    cy.get('div.formio-builder-form').then($el => {
    const coords = $el[0].getBoundingClientRect();
    cy.get('span.btn').contains('Text/Images')
      
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -50, { force: true })
      .trigger('mouseup', { force: true });
      //cy.get('p').contains('Multi-line Text Component');
      cy.waitForLoad();
    //cy.get('ck ck-icon ck-button__icon').click();
    //cy.get('ck ck-button ck-off ck-dropdown__button').click();
    //cy.get('button').contains('Show more items').click();
    cy.get('div.ck.ck-dropdown.ck-toolbar__grouped-dropdown.ck-toolbar-dropdown > button.ck.ck-button.ck-off.ck-dropdown__button').click();
    
    
   cy.get('span.ck-file-dialog-button > button.ck.ck-button.ck-off').click();
   
  
   cy.get('input[type="file"]').invoke('show');
   let fileUploadInputField = cy.get('input[type=file]')
   
   //fileUploadInputField.should('not.to.be.null');
   //cy.get('input[type=file]').should('not.to.be.null');
   fileUploadInputField.attachFile('add1.png');
    //cy.get('button').contains('Save').click();
    cy.get('.btn-success').click();
  });
  cy.get('div.formio-builder-form').then($el => {
    const coords = $el[0].getBoundingClientRect();
    cy.get('span.btn').contains('Columns - 2')
    
    .trigger('mousedown', { which: 1}, { force: true })
    .trigger('mousemove', coords.x, +5, { force: true })
    .trigger('mouseup', { force: true });
    
    //cy.get('input[name="data[label]"]').clear().type('ID Number');
    
    cy.get('button').contains('Save').click();
});
cy.get('div.formio-builder-form').then($el => {
  const coords = $el[0].getBoundingClientRect();
  cy.get('span.btn').contains('Columns - 3')
  
  .trigger('mousedown', { which: 1}, { force: true })
  .trigger('mousemove', coords.x, -50, { force: true })
  .trigger('mouseup', { force: true });
  
  //cy.get('input[name="data[label]"]').clear().type('Home address');
  cy.get('button').contains('Save').click();
});

cy.get('div.formio-builder-form').then($el => {
  const coords = $el[0].getBoundingClientRect();
  cy.get('span.btn').contains('Tabs')
  
  .trigger('mousedown', { which: 1}, { force: true })
  .trigger('mousemove', coords.x, +10, { force: true })
  .trigger('mouseup', { force: true });
  
  cy.get('tbody > tr > :nth-child(2)').click();
        
        cy.get('tbody > tr > :nth-child(2)').type('Info');
  cy.get('button').contains('Save').click();
});















});



});