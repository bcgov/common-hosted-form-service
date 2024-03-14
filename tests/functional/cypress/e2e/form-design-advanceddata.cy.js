import 'cypress-keycloak-commands';
import 'cypress-drag-drop';

const depEnv = Cypress.env('depEnv');


Cypress.Commands.add('waitForLoad', () => {
  const loaderTimeout = 80000;

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
  


it('Visits the form design page for advanced Data', () => {

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

 
  
 // Form design page with advanced data components

  
  
    //cy.visit(`/${depEnv}/form/manage?f=5685fa60-e0f3-47e8-aecb-be3b1365b0bd`);
    //cy.waitForLoad();
    //cy.get('a > .v-btn > .v-btn__content > .mdi-pencil').click();
    //cy.waitForLoad();
    cy.get('button').contains('Advanced Data').click();
    cy.waitForLoad();
    cy.waitForLoad();
    cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('span.btn').contains('Container')
        
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -400, { force: true })
        //.trigger('mousemove', coords.y, +100, { force: true })
        .trigger('mouseup', { force: true });
        
        cy.get('input[name="data[label]"]').clear().type('Application');
        cy.get('input[name="data[customClass]"]').type('bg-primary');
        cy.waitForLoad();
        
        cy.get('button').contains('Save').click();
    });
    cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('span.btn').contains('Data Grid')
        
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -400, { force: true })
        //.trigger('mousemove', coords.y, +100, { force: true })
        .trigger('mouseup', { force: true });
        
        cy.get('input[name="data[label]"]').clear().type('Application');
        cy.get('input[name="data[customClass]"]').type('bg-primary');
        cy.waitForLoad();
       
        
        
        cy.get('button').contains('Save').click();
    
        /*cy.get('[aria-describedby="v-tooltip-51"]').click();
        let fileUploadInputField = cy.get('input[type=file]');
        //fileUploadInputField.should('not.to.be.null');
        cy.get('input[type=file]').should('not.to.be.null');
        fileUploadInputField.attachFile('forms/griddata.json');
    
    */
    });
    
        
    cy.get('[ref=editJson]').then($el => {
    
            const rem=$el[1];
            rem.click();
    
    });
    
    let acecont=cy.get('div.ace_content');
    
    cy.get('div.ace_content').then($el => {
    cy.get('div.ace_content').type('{selectall}{backspace}');
    
    //var pretty = JSON.stringify ({"firstname":"nim"});
    
    
    //var pretty = JSON.stringify(trackdata);
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
    cy.get('div.formio-builder-form').then($el => {
      const coords = $el[0].getBoundingClientRect();
      cy.get('span.btn').contains('Edit Grid')
      
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -500, { force: true })
      //.trigger('mousemove', coords.y, +100, { force: true })
      .trigger('mouseup', { force: true });
      
      cy.get('input[name="data[label]"]').clear().type('Add more days');
      cy.get('input[name="data[customClass]"]').type('bg-primary');
      cy.waitForLoad();
      
      cy.get('button').contains('Save').click();
    });
    cy.get('button').contains('Basic Fields').click();
    cy.get('div.formio-builder-form').then($el => {
            const coords = $el[0].getBoundingClientRect();
            cy.get('span.btn').contains('Day')
            
            .trigger('mousedown', { which: 1}, { force: true })
            .trigger('mousemove', coords.x, -400, { force: true })
            .trigger('mouseup', { force: true });
            //cy.get('p').contains('Multi-line Text Component');
            
            cy.get('button').contains('Save').click();
    });
    cy.get('button').contains('Advanced Data').click();
    cy.get('div.formio-builder-form').then($el => {
            const coords = $el[0].getBoundingClientRect();
            cy.get('span.btn').contains('Data Map')
            
            .trigger('mousedown', { which: 1}, { force: true })
            .trigger('mousemove', coords.x, -300, { force: true })
            .trigger('mouseup', { force: true });
            //cy.get('p').contains('Multi-line Text Component');
            
            cy.get('button').contains('Save').click();
    }); 
    
    
    
    
    
    
    });
    
});
        
