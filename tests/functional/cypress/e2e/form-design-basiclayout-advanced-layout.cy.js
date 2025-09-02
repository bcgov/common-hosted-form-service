
import 'cypress-keycloak-commands';
import { formsettings } from '../support/login.js';

const depEnv = Cypress.env('depEnv');


Cypress.Commands.add('waitForLoad', () => {
  const loaderTimeout = 80000;

  cy.get('.nprogress-busy', { timeout: loaderTimeout }).should('not.exist');
});



describe('Form Designer', () => {

  
    
    cy.on('uncaught:exception', (err, runnable) => {
      // Form.io throws an uncaught exception for missing projectid
      // Cypress catches it as undefined: undefined so we can't get the text
      console.log(err);
      return false;
    });
    

  


it('Visits the form settings page', () => {
    
    
  cy.viewport(1000, 1100);
  cy.waitForLoad();
  
  formsettings();
  

});

 
  // Form design page for Field set components
it('Checks the Field set', () => {

  cy.viewport(1000, 1100);
  cy.get('button').contains('Advanced Layout').click();
  cy.get('div.formio-builder-form').then($el => {
    const coords = $el[0].getBoundingClientRect();
    cy.get('span.btn').contains('Field Set')
    
    .trigger('mousedown', { which: 1}, { force: true })
    .trigger('mousemove', coords.x, -400, { force: true })
    //.trigger('mousemove', coords.y, -50, { force: true })
    .trigger('mouseup', { force: true });
    cy.waitForLoad();
    cy.get('input[name="data[legend]"]').clear().type('Application');
    cy.get('input[name="data[customClass]"]').type('bg-primary');
    
    
    
    cy.get('button').contains('Save').click();
});

});
// form design page for Text/images components
it('Checks the Text/images', () => {

  cy.viewport(1000, 1100);
// form design page for Basic Layout components
  cy.get('button').contains('Basic Layout').click();

//
    cy.get('div.formio-builder-form').then($el => {
    const coords = $el[0].getBoundingClientRect();
    cy.get('span.btn').contains('Text/Images')
      
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -50, { force: true })
      .trigger('mouseup', { force: true });
      cy.waitForLoad();
  
    cy.get('button').contains('Save').click();
    
  });
});
it('Checks the Coulmns-3', () => {

  cy.viewport(1000, 1100);
  cy.get('div.formio-builder-form').then($el => {
    const coords = $el[0].getBoundingClientRect();
    cy.get('span.btn').contains('Columns - 3')
    
    .trigger('mousedown', { which: 1}, { force: true })
    .trigger('mousemove', coords.x, -140, { force: true })
    .trigger('mouseup', { force: true });
    
    
    
    cy.get('button').contains('Save').click();
});


});
it('Checks the tabs', () => {


cy.viewport(1000, 1100);

cy.get('div.formio-builder-form').then($el => {
  const coords = $el[0].getBoundingClientRect();
  cy.get('span.btn').contains('Tabs')
  
  .trigger('mousedown', { which: 1}, { force: true })
  .trigger('mousemove', coords.x, -50, { force: true })
  .trigger('mouseup', { force: true });
  
  cy.get('tbody > tr > :nth-child(2)').click();
  cy.get('[name="data[components][0][label]"]').clear().type('work');
  cy.get('tfoot > tr > td > .btn').click();
  
        
  cy.get('[name="data[components][1][label]"]').clear().type('Home');
  cy.get('button').contains('Save').click();
});

});




it('Checks the HTML Element', () => {

  

cy.viewport(1000, 1100);
cy.waitForLoad();
// using Advance Layout components
cy.get('button').contains('Advanced Layout').click();

cy.waitForLoad();
cy.get('div.formio-builder-form').then($el => {
      const coords = $el[0].getBoundingClientRect();
      cy.get('span.btn').contains('HTML Element')
      
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -50, { force: true })
      //.trigger('mousemove', coords.y, -50, { force: true })
      .trigger('mouseup', { force: true });
      cy.get('tbody > tr > :nth-child(2)').click();
        //cy.get('[name="data[components][0][label]"]').clear();
        cy.get('[name="data[attrs][0][attr]"]').type('type');
        //cy.get('tfoot > tr > td > .btn').click();
        cy.get('[name="data[attrs][0][value]"]').type('text');
       
      
      cy.get('button').contains('Save').click();
});

});
it('Checks the Columns', () => {


cy.viewport(1000, 1100);
cy.waitForLoad();
cy.get('button').contains('Advanced Layout').click();
cy.waitForLoad();
cy.get('div.formio-builder-form').then($el => {
      const coords = $el[0].getBoundingClientRect();
      //cy.get('span.btn').contains('Columns')
      cy.get('[data-type="columns"]')
      
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -140, { force: true })
      .trigger('mouseup', { force: true });
      cy.waitForLoad();
      cy.get('tbody > :nth-child(1) > :nth-child(2)').click();
      cy.get('.choices__item').then($el => {

        const rem=$el[1];
        rem.click();
        
        
        });
        
      
      cy.waitForLoad();
      cy.get('input[name="data[columns][0][width]"]').type('3');
      cy.get('input[name="data[columns][1][width]"]').type('9');
      cy.get('button').contains('Save').click();
});

});


it('Checks the Table', () => {


    cy.viewport(1000, 1100);
    cy.waitForLoad();

    
    cy.waitForLoad();

    cy.get('div.formio-builder-form').then($el => {
      const coords = $el[0].getBoundingClientRect();
      cy.get('span.btn').contains('Table')
      
      .trigger('mousedown', { which: 1}, { force: true })
      //.trigger('mousemove', coords.x, -50, { force: true })
      .trigger('mousemove', coords.y, +50, { force: true })
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
     //
     //cy.log(arrayValues[2]);
     let dval=arr[2].split('&');
     cy.log(dval);
     //Form preview
     cy.visit(`/${depEnv}/form/preview?f=${arrayValues[0]}&d=${dval[0]}`);
     cy.waitForLoad();
     cy.get('.nav-item.active > .nav-link').should('be.visible');
     cy.get(':nth-child(2) > .nav-link').should('be.visible');
     cy.get('.card-body.active').should('be.visible');
     cy.get('fieldset').should('be.visible');
     cy.get('legend').should('be.visible');
     cy.get('.v-skeleton-loader > .v-container').should('be.visible');
     cy.visit(`/${depEnv}`);
     cy.get('[data-cy="userFormsLinks"]').click();
     cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
     cy.waitForLoad();
    //Delete form after test run
      //cy.get('.mdi-delete').click();
      cy.get(':nth-child(5) > .v-btn > .v-btn__content > .mdi-delete').click();
      cy.get('[data-test="continue-btn-continue"]').click();
      cy.get('#logoutButton > .v-btn__content > span').click();

     })

});



});
