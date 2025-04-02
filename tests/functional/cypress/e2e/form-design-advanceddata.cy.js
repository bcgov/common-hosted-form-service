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
    

 // Form design page with Advanced Data components 

// Checks the Container component
it('Checks the Container component', () => {

  cy.viewport(1000, 1100);
    formsettings();
 
    cy.get('button').contains('Advanced Data').click();
    cy.waitForLoad();
    cy.waitForLoad();
    cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('span.btn').contains('Container')
        
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -400, { force: true })
        .trigger('mouseup', { force: true });
        cy.get('input[name="data[label]"]').clear().type('Application');
        cy.get('input[name="data[customClass]"]').type('bg-primary');
        cy.waitForLoad();
        
        cy.get('button').contains('Save').click();
    });

  });
  // Checks the Data Grid component
  
  
  it('Checks Day component', () => {

    cy.viewport(1000, 1100);
    cy.get('button').contains('Basic Fields').click();
    cy.get('div.formio-builder-form').then($el => {
            const coords = $el[0].getBoundingClientRect();
            cy.get('span.btn').contains('Day')
            
            .trigger('mousedown', { which: 1}, { force: true })
            .trigger('mousemove', coords.x, -400, { force: true })
            .trigger('mouseup', { force: true });
            cy.get('button').contains('Save').click();
    });


  });
// Checks Data Map component
  it('Checks Data Map component', () => {

    cy.viewport(1000, 1100);
    cy.get('button').contains('Advanced Data').click();
    cy.get('div.formio-builder-form').then($el => {
            const coords = $el[0].getBoundingClientRect();
            cy.get('span.btn').contains('Data Map')
            
            .trigger('mousedown', { which: 1}, { force: true })
            .trigger('mousemove', coords.x, -300, { force: true })
            .trigger('mouseup', { force: true });
            cy.get('button').contains('Save').click();
    });
    
  });
  it('Checks the Data Grid component', () => {

      cy.viewport(1000, 1100);
      cy.get('div.formio-builder-form').then($el => {
          const coords = $el[0].getBoundingClientRect();
          cy.get('span.btn').contains('Data Grid')
          
          .trigger('mousedown', { which: 1}, { force: true })
          .trigger('mousemove', coords.x, -400, { force: true })
          .trigger('mouseup', { force: true });
          
          cy.get('input[name="data[label]"]').clear().type('Application');
          cy.get('input[name="data[customClass]"]').type('bg-primary');
          cy.waitForLoad();
          cy.get('button').contains('Save').click();
      
      });
      /*
        //Verify Edit Json button   
      cy.get('[ref=editJson]').then($el => {
      
              const rem=$el[1];
              rem.click();
      
      });
      
      let acecont=cy.get('div.ace_content');
      
      cy.get('div.ace_content').then($el => {
      cy.get('div.ace_content').type('{selectall}{backspace}');
      
      var pretty=JSON.stringify({
        "type": "datagrid",
  
              "components": [
                {
                "type": "select",
                  data: {
                  values: [
                    {
                      "value": "male",
                      "label": "Male"
                    },
                    {
                      "value": "female",
                      "label": "Female"
                    }
                  ]
                 },
                 
                } 
              ]
      })
        
      cy.get('div.ace_content').type(pretty,{ parseSpecialCharSequences: false });
      cy.wait(2000);
      
      cy.get('.ui').click();
      cy.contains('Male').should('be.visible');
      
      cy.get('button').contains('Save').click();
         
       */       
          
      //});
    }); 
   // Checks the Edit Grid Component
  it('Checks the Edit Grid Component', () => {

    cy.viewport(1000, 1100);
    cy.get('div.formio-builder-form').then($el => {
      const coords = $el[0].getBoundingClientRect();
      cy.get('span.btn').contains('Edit Grid')
      
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -500, { force: true })
      .trigger('mouseup', { force: true });
      
      cy.get('input[name="data[label]"]').clear().type('Add more days');
      cy.get('input[name="data[customClass]"]').type('bg-primary');
      cy.waitForLoad();
      
      cy.get('button').contains('Save').click();
    });
  
 // Form saving
   let savedButton = cy.get('[data-cy=saveButton]');
   expect(savedButton).to.not.be.null;
   savedButton.trigger('click');
   cy.wait(2000);

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
     // Form preview
     cy.visit(`/${depEnv}/form/preview?f=${arrayValues[0]}&d=${dval[0]}`);
     cy.waitForLoad();
     cy.get('.v-skeleton-loader > .v-container').should('be.visible');
     cy.get('.list-group-item').should('exist');
     //cy.get('[ref="datagrid-dataGrid"]').should('be.visible');
     cy.get('.col-md-1').should('be.visible');

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
