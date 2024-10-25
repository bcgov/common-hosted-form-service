import 'cypress-keycloak-commands';
import 'cypress-drag-drop';
import { formsettings } from '../support/login.js';

const depEnv = Cypress.env('depEnv');


Cypress.Commands.add('waitForLoad', () => {
  const loaderTimeout = 60000;

  cy.get('.nprogress-busy', { timeout: loaderTimeout }).should('not.exist');
});



describe('Form Designer', () => {
  

 /* beforeEach(()=>{
    
    
    */let str;
    
    cy.on('uncaught:exception', (err, runnable) => {
      // Form.io throws an uncaught exception for missing projectid
      // Cypress catches it as undefined: undefined so we can't get the text
      console.log(err);
      return false;
    });

  /*});
  */it('Visits the form settings page', () => {
    
    
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    
    formsettings();
    

  });
    
// Verifying fields in the form settings page
  it('DesignTextbox components', () => {
    cy.viewport(1000, 1100);
    cy.get('button').contains('Basic Fields').click();
    let textFields = ["First Name", "Middle Name", "Last Name"];

    for(let i=0; i<textFields.length; i++) {
      cy.get('button').contains('Basic Fields').click();
      cy.get('div.formio-builder-form').then($el => {
      const bounds = $el[0].getBoundingClientRect();
      cy.get('span.btn').contains('Text Field')
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', bounds.x, -50, { force: true })
        .trigger('mouseup', { force: true });
        cy.get('p').contains('Text Field Component');
        cy.get('input[name="data[label]"]').clear();
        cy.get('input[name="data[label]"]').clear();
        cy.get('input[name="data[label]"]').type(textFields[i]);
        cy.get('button').contains('Save').click();
      });
    }

  });
    

  it('Design Multi-line text components', () => {
    cy.viewport(1000, 1100);
    cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('span.btn').contains('Multi-line Text')
        
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, +20, { force: true })
        .trigger('mouseup', { force: true });
        //cy.get('p').contains('Multi-line Text Component');
        cy.get('input[name="data[label]"]').clear();
        cy.get('input[name="data[label]"]').clear().type('Question');
        cy.get('button').contains('Save').click();
    });

  });

  it('Design SelectList components', () => {
    cy.viewport(1000, 1100);
    cy.get('div.formio-builder-form').then($el => {
        const coords1 = $el[0].getBoundingClientRect();
        cy.get('span.btn').contains('Select List')
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords1.x, -50, { force: true })
        .trigger('mouseup', { force: true });
        cy.get('p').contains('Select List Component');
        cy.get('input[name="data[label]"]').clear();
        cy.get('input[name="data[label]"]').clear();
        cy.get('input[name="data[label]"]').type('Select Gender');
        cy.get(':nth-child(2) > .nav-link').click();
        cy.get('tbody > tr > :nth-child(2)').click();
        
        cy.get('tbody > tr > :nth-child(2)').type('Male');
        cy.get('tfoot > tr > td > .btn').click();
        cy.get('tbody > :nth-child(2) > :nth-child(2)').type('Female');

        cy.get('button').contains('Save').click();

    });

  });
  it('Design Checkbox components', () => {
    cy.viewport(1000, 1100);
    cy.get('div.formio-builder-form').then($el => {
        const coords2 = $el[0].getBoundingClientRect();
        cy.get('span.btn').contains('Checkbox')
        
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords2.x, -50, { force: true })
        .trigger('mouseup', { force: true });
        cy.get('p').contains('Checkbox Component');
        cy.get('input[name="data[label]"]').clear();
        cy.get('input[name="data[label]"]').clear();
        cy.get('input[name="data[label]"]').type('Applying for self');
        cy.get('button').contains('Save').click();
    });

  });
  it('Design Checkbox Group components', () => {
    cy.viewport(1000, 1100);
    cy.get('div.formio-builder-form').then($el => {
        const coords3 = $el[0].getBoundingClientRect();
        cy.get('span.btn').contains('Checkbox Group')
        
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords3.x, -50, { force: true })
        .trigger('mouseup', { force: true });
        cy.get('p').contains('Checkbox Group Component');
       // cy.get('.nav-item.active > .nav-link').click();
       cy.get('input[name="data[label]"]').clear();
       cy.get('input[name="data[label]"]').clear();
       
        cy.get('input[name="data[label]"]').type('Select all skills');
        cy.get(':nth-child(2) > .nav-link').click();
        cy.get('tbody > tr > :nth-child(2)').click();
        
        cy.get('tbody > tr > :nth-child(2)').type('Javascript');
        cy.get('tfoot > tr > td > .btn').click();
        cy.get('tbody > :nth-child(2) > :nth-child(2)').type('python');
        

        cy.get('button').contains('Save').click();
    });

  });
  it('Design Number components', () => {
    cy.viewport(1000, 1100);  
    cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('span.btn').contains('Number')
        
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -50, { force: true })
        .trigger('mouseup', { force: true });
        //cy.get('p').contains('Multi-line Text Component');
        
        cy.get('button').contains('Save').click();
    });
  });
  it('Design Phone Number components', () => {
    cy.viewport(1000, 1100);
    cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('span.btn').contains('Phone Number')
        
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -50, { force: true })
        .trigger('mouseup', { force: true });
        //cy.get('p').contains('Multi-line Text Component');
        cy.get('input[name="data[label]"]').clear();
        cy.get('input[name="data[label]"]').clear();
        cy.get('input[name="data[label]"]').type('Phone Number');
        cy.get('button').contains('Save').click();
    });
  });
  it('Design Email components', () => {
    cy.viewport(1000, 1100);
    

  });

  it('Design date/Time components', () => {
    cy.viewport(1000, 1100);
    cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('span.btn').contains('Date / Time')
        
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -50, { force: true })
        .trigger('mouseup', { force: true });
        //cy.get('p').contains('Multi-line Text Component');
        cy.get('button').contains('Save').click();
        cy.waitForLoad();
    });
    cy.intercept('GET', `/${depEnv}/api/v1/forms/*`).as('getForm');
      let savedButton = cy.get('[data-cy=saveButton]');
      expect(savedButton).to.not.be.null;
      savedButton.trigger('click');
      cy.waitForLoad();

  });
    
    
    
    // Form Editing 
  it('Form Edit', () => {
      cy.viewport(1000, 1100);
      cy.waitForLoad();
      cy.on('uncaught:exception', (err, runnable) => {
        // Form.io throws an uncaught exception for missing projectid
        // Cypress catches it as undefined: undefined so we can't get the text
        console.log(err);
        return false;
      });
      
      cy.waitForLoad();
      cy.get('.mdi-cog').click();
      cy.get('a > .v-btn > .v-btn__content > .mdi-pencil').click();
      cy.wait(4000);
      
      //Adding another component
      cy.get('label').contains('First Name').should('be.visible');
      cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('span.btn').contains('Text/Images')
        
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, +10, { force: true })
        .trigger('mouseup', { force: true });
        //cy.get('p').contains('Multi-line Text Component');
        
        cy.get('button').contains('Save').click();
      });
      cy.wait(4000);
      cy.get('[data-cy=saveButton]').click();
      cy.waitForLoad();

    // Filter the newly created form
      cy.location('search').then(search => {
     //let pathName = fullUrl.pathname
      let arr = search.split('=');
      let arrayValues = arr[1].split('&');
      cy.log(arrayValues[0]);
      let dval=arr[2].split('&');
      cy.log(dval);
      //Form preview
      cy.visit(`/${depEnv}/form/preview?f=${dval[0]}&d=${arrayValues[0]}`);
      cy.waitForLoad();
      cy.get('label').contains('Last Name').should('be.visible');
      cy.get('label').contains('First Name').should('be.visible');
      cy.get('label').contains('Applying for self').should('be.visible');
      cy.get('label').contains('Select all skills').should('be.visible');
      cy.get('label').contains('Phone Number').should('be.visible');
      cy.get('label').contains('Date / Time').should('be.visible');
      cy.get('label').contains('Select Gender');

     //Delete form after test run
      cy.visit(`/${depEnv}/form/design?d=${arrayValues[0]}&f=${dval[0]}`);
      cy.wait(4000);
      cy.get('[data-cy="settingsRouterLink"] > .v-btn').click();
      cy.waitForLoad();
      cy.get('[data-test="canRemoveForm"]').click();
      cy.get('[data-test="continue-btn-continue"]').click();
     
      });
  });

});