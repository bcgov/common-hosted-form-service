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
        cy.get('input[name="data[label]"]').clear();
        cy.get('input[name="data[label]"]').clear();
        cy.get('input[name="data[label]"]').type('Number');
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
    cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('span.btn').contains('Email')
        
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -10, { force: true })
        .trigger('mouseup', { force: true });
        //cy.get('p').contains('Multi-line Text Component');
        
        cy.get('button').contains('Save').click();
    });

  });

  it('Design date/Time components', () => {
    cy.viewport(1000, 1100);
    cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('span.btn').contains('Date / Time')
        
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -70, { force: true })
        .trigger('mouseup', { force: true });
        //cy.get('p').contains('Multi-line Text Component');
        cy.get('button').contains('Save').click();
        cy.waitForLoad();
    });

  });
    
    
    
    // Form Editing 
  it('Form Edit', () => {
      cy.viewport(1000, 1100);
      cy.intercept('GET', `/${depEnv}/api/v1/forms/*`).as('getForm');
      let savedButton = cy.get('[data-cy=saveButton]');
      expect(savedButton).to.not.be.null;
      savedButton.trigger('click');
      cy.waitForLoad();
      cy.get('[data-cy="settingsRouterLink"]').click();
      cy.get('a > .v-btn > .v-btn__content > .mdi-pencil').click();
      cy.waitForLoad();
      cy.waitForLoad();
      
      //Adding another component

      cy.get('button').contains('Basic Fields').click();
      cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('span.btn').contains('Number')
        
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -50, { force: true })
        .trigger('mouseup', { force: true });
        //cy.get('p').contains('Multi-line Text Component');
        cy.get('input[name="data[label]"]').clear().type('ID Number');
        cy.get('button').contains('Save').click();
      });
      cy.get('[ref=removeComponent]').then($el => {

        const rem=$el[11];
        rem.click();
        
        });


      cy.get('[data-cy=saveButton]').click();
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
     cy.visit(`/${depEnv}/form/preview?f=${dval[0]}&d=${arrayValues[0]}`);
     cy.waitForLoad();
     cy.get('label').contains('Last Name');
     cy.get('label').contains('First Name');
     cy.get('input[name="data[simplecheckbox1]"]').should('be.visible');
     cy.get('label').contains('Select all skills');
     cy.get('input[name="data[simplephonenumber1]').should('be.visible');
     cy.get('input[name="data[simpledatetime]').should('be.visible');
     cy.get('input[name="data[simpleemail]').should('be.visible');
     cy.get('input[name="data[simplenumber1]').should('be.visible');
     cy.get('label').contains('Select Gender');



    
  });


});

});