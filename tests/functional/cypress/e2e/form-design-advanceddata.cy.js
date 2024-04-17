import 'cypress-keycloak-commands';
import 'cypress-drag-drop';
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
    
        
    cy.get('[ref=editJson]').then($el => {
    
            const rem=$el[1];
            rem.click();
    
    });
    
    let acecont=cy.get('div.ace_content');
    
    cy.get('div.ace_content').then($el => {
    cy.get('div.ace_content').type('{selectall}{backspace}');
    
    var pretty=JSON.stringify({
      "label": "Applicant Details",
          "customClass": "bg-primary",
          "reorder": false,
          "addAnotherPosition": "bottom",
          "layoutFixed": false,
          "enableRowGroups": false,
          "initEmpty": false,
          "tableView": false,
          "key": "dataGrid",
          "type": "datagrid",
          "input": true,
          "components": [
          {
            "label": "Children",
            "key": "children",
            "type": "datagrid",
            "input": true,
            "validate": {
              "minLength": 3,
              "maxLength": 6
            },
            "components": [
                {
                  "label": "First Name",
                  "key": "firstName",
                  "type": "textfield",
                  "input": true,
                  "tableView": true,
              },
              
                {
                  "label": "Last Name",
                  "key": "lastName",
                  "type": "textfield",
                  "input": true,
                  "tableView": true
                },
                {
                  "label": "Gender",
                  "key": "gender",
                  "type": "select",
                  "input": true,
                  data: {
                    values: [
                      {
                        "value": "male",
                        "label": "Male"
                      },
                      {
                        "value": "female",
                        "label": "Female"
                      },
                      {
                        "value": "other",
                        "label": "Other"
                      }
                    ]
                  },
                  
                }
      
            ]
    
          }
    
        ]
      
      
      
      })
      
    cy.get('div.ace_content').type(pretty,{ parseSpecialCharSequences: false });
    cy.get('button').contains('Save').click();
    cy.get('.ui').click();
    cy.contains('Male').should('be.visible');
       
            
        
    });

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
  });
  it('Visits the form design page for advanced Data', () => {

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
     // Form preview
     cy.visit(`/${depEnv}/form/preview?f=${arrayValues[0]}&d=${dval[0]}`);
     cy.waitForLoad();
     cy.get('.v-skeleton-loader > .v-container').should('be.visible');
     cy.get('.list-group-item').should('be.visible');
     cy.get('[ref="datagrid-dataGrid"]').should('be.visible');
     cy.get('.col-md-1').should('be.visible');
     
   })
    
});
    
});