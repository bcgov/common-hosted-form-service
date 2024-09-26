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
    it('Checks the simpleradioadvanced', () => {

    cy.viewport(1000, 1800);
    cy.waitForLoad();
    
 // Form design page with advanced Fields components
    cy.get('button').contains('Advanced Fields').click();
    cy.get('button').contains('Advanced Fields').click();
    cy.waitForLoad();
    cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.waitForLoad();
        cy.get('[data-type="simpleradioadvanced"]')
       
        
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -850, { force: true })
        //.trigger('mousemove', coords.y, +100, { force: true })
        .trigger('mouseup', { force: true });
        cy.waitForLoad();
        cy.get(':nth-child(2) > .nav-link').click();
        cy.get(':nth-child(2) > .nav-link').click();
        //cy.get('[href="#data"]').click();        
        
        cy.get('input[name="data[values][0][label]"]').type('Canadian');
        cy.get('input[name="data[values][0][value]"]').type('1');
        
        cy.waitForLoad();
        
        cy.get('button').contains('Save').click();
    });

    }); 
    it('Checks the simpletextareaadvanced', () => {

    cy.viewport(1000, 1800);
    cy.waitForLoad();
    cy.get('div.formio-builder-form').then($el => {
      const coords = $el[0].getBoundingClientRect();
      cy.get('[data-type="simpletextareaadvanced"]')
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -400, { force: true })
        //.trigger('mousemove', coords.y, +100, { force: true })
      .trigger('mouseup', { force: true });
      cy.get('input[name="data[customClass]"]').type('bg-primary');
      cy.waitForLoad();
        
      cy.get('button').contains('Save').click();


    });
    }); 
    it('Checks the simpleurladvanced', () => {
    cy.viewport(1000, 1800);
    cy.waitForLoad();   
    cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('[data-type="simpleurladvanced"]')
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -250, { force: true })
          //.trigger('mousemove', coords.y, +100, { force: true })
        .trigger('mouseup', { force: true });
        cy.get('input[name="data[prefix]"]').type('https://');
        
        cy.get('input[name="data[suffix]"]').type('.com');

        cy.waitForLoad();
          
        cy.get('button').contains('Save').click();
  
  
    });
    });
    it('Checks the simpleselectboxesadvanced', () => {
      cy.viewport(1000, 1800);
      cy.waitForLoad();
      cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('[data-type="simpleselectboxesadvanced"]')
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -750, { force: true })
          
        .trigger('mouseup', { force: true });
        cy.get(':nth-child(2) > .nav-link').click();
        cy.get(':nth-child(2) > .nav-link').click();
        cy.get('input[name="data[values][0][label]"]').type('Eligible');
        cy.get('input[name="data[values][0][value]"]').type('1');
        
        

        cy.waitForLoad();
          
        cy.get('button').contains('Save').click();
  
  
      });
    });

    it('Checks the simpletagsadvanced', () => {

      cy.viewport(1000, 1800);
      cy.waitForLoad();
      cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('[data-type="simpletagsadvanced"]')
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -250, { force: true })
          //.trigger('mousemove', coords.y, +100, { force: true })
        .trigger('mouseup', { force: true });
        cy.waitForLoad();
          
        cy.get('button').contains('Save').click();
  
  
      });
    });

    it('Checks the simplefile', () => {
      cy.viewport(1000, 1800);
      cy.waitForLoad();
      cy.get('button').contains('BC Government').click();
      cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('[data-type="simplefile"]')
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -150, { force: true })
          //.trigger('mousemove', coords.y, +100, { force: true })
        .trigger('mouseup', { force: true });
        cy.waitForLoad();
          
        cy.get('button').contains('Save').click();
  
  
      });
    });
    // Check registered business address
    it('Checks the orgbook', () => {

      cy.viewport(1000, 1800);
      cy.waitForLoad();
      cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('[data-type="orgbook"]')
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -30, { force: true })
          //.trigger('mousemove', coords.y, +100, { force: true })
        .trigger('mouseup', { force: true });
        cy.waitForLoad();
          
        cy.get('button').contains('Save').click();
  
  
      });

    });

    it('Checks the bcaddress', () => {
      cy.viewport(1000, 1800);
      cy.waitForLoad();
      cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('[data-type="bcaddress"]')
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, +30, { force: true })
          //.trigger('mousemove', coords.y, +100, { force: true })
        .trigger('mouseup', { force: true });
        cy.waitForLoad();
          
        cy.get('button').contains('Save').click();
  
  
      });

    });

    it('Verify submission', () => {
      cy.viewport(1000, 1800);
      cy.waitForLoad();
      cy.waitForLoad();
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
          //cy.log(arrayValues[1]);
          //cy.log(arrayValues[2]);
          cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
          cy.waitForLoad();
          })
       
        //Publish the form
        cy.get('.v-label > span').click();
    
        cy.get('span').contains('Publish Version 1');
    
        cy.contains('Continue').should('be.visible');
        cy.contains('Continue').trigger('click');

        //Share link verification
        let shareFormButton = cy.get('[data-cy=shareFormButton]');
        expect(shareFormButton).to.not.be.null;
        shareFormButton.trigger('click').then(()=>{
          //let shareFormLinkButton = cy.get('[data-cy=shareFormLinkButtonss]');
          let shareFormLinkButton=cy.get('.mx-2');
          expect(shareFormLinkButton).to.not.be.null;
          shareFormLinkButton.trigger('click');
          
          //Close  form share window
          cy.get('.v-card-actions > .v-btn > .v-btn__content > span').click();
        });
        cy.location('search').then(search => {
          //let pathName = fullUrl.pathname
        let arr = search.split('=');
        let arrayValues = arr[1].split('&');
        cy.visit(`/${depEnv}/form/submit?f=${arrayValues[0]}`);
        cy.waitForLoad();
       
        cy.waitForLoad();
        // for print option verification
        cy.get(':nth-child(2) > .d-print-none > :nth-child(1) > .v-btn').should('be.visible');
        cy.get('.mdi-printer').should('be.visible');
        cy.get('.mdi-content-save').should('be.visible');
        cy.waitForLoad();

        cy.waitForLoad();
        cy.waitForLoad();
        cy.waitForLoad();
        cy.waitForLoad();
        cy.waitForLoad();
        cy.waitForLoad();
        cy.get('input[type="radio"]').click();
        cy.get('input[type="checkbox"]').click();
    
        cy.get('div').find('textarea').type('some text');
        cy.get('input[name="data[simpleurladvanced]"').type('www.google');
        cy.get('.choices__inner').click();
        cy.get('.choices__inner').type('hello');
        cy.get('label').contains('Registered Business Name').click();
        cy.waitForLoad();
        cy.get('input[placeholder="Type to search"]').type("Thrifty Foods");
        cy.contains('THRIFTY FOODS').click();
        cy.get('input[name="data[bcaddress]"').click();
        cy.get('input[name="data[bcaddress]"').type('2260 Sooke');
        cy.contains('2260 Sooke').click();
        cy.get('.browse').should('have.attr', 'ref').and('include', 'fileBrowse');
        cy.get('.browse').should('have.attr', 'href').and('include', '#');
        cy.get('.browse').click();
        let fileUploadInputField = cy.get('input[type=file]');
        cy.get('input[type=file]').should('not.to.be.null');
        fileUploadInputField.attachFile('add1.png');
        cy.waitForLoad();
        cy.waitForLoad();
        //verify file uploads to object storage

        cy.get('.col-md-9 > a').should('have.attr', 'ref').and('include', 'fileLink');
        cy.get('div.col-md-2').contains('61.48 kB');

        //form submission
        cy.get('button').contains('Submit').click();
        cy.waitForLoad();
        cy.get('button').contains('Submit').click();
       // verify the components after submission
        cy.get('span').contains('Canadian').should('be.visible');
        cy.get('span').contains('Eligible').should('be.visible');
        cy.get('.choices__inner > .choices__list > .choices__item').contains('hello');
        cy.get('.col-md-9 > a').contains('add1.png');
        cy.get('.ui > .choices__list > .choices__item').contains('THRIFTY FOODS');

        //Delete form after test run
        cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
        cy.waitForLoad();
        cy.waitForLoad();
        cy.get('.mdi-delete').click();
        cy.get('[data-test="continue-btn-continue"]').click();
        
        })

    });
});