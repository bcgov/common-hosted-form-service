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
  


it('Visits the form design page for Advanced Data', () => {
cy.visit(`/${depEnv}/form/manage?f=5685fa60-e0f3-47e8-aecb-be3b1365b0bd`);
cy.waitForLoad();
cy.get('a > .v-btn > .v-btn__content > .mdi-pencil').click();
cy.waitForLoad();
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
 






});


});



