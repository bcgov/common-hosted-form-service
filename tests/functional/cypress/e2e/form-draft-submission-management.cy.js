import 'cypress-keycloak-commands';
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
// Publish a simple form 
it('Verify draft submission', () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    
    cy.get('button').contains('Basic Fields').click();
    cy.get('div.formio-builder-form').then($el => {
      const coords = $el[0].getBoundingClientRect();
      cy.get('span.btn').contains('Text Field')
      
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -110, { force: true })
      .trigger('mouseup', { force: true });
      cy.get('button').contains('Save').click();
    });
    //Multiline Text
    cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('span.btn').contains('Multi-line Text')
        
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -110, { force: true })
        .trigger('mouseup', { force: true });
        cy.get('button').contains('Save').click();
    });
    
  // Form saving
    let savedButton = cy.get('[data-cy=saveButton]');
    expect(savedButton).to.not.be.null;
    savedButton.should('be.visible').trigger('click');
    cy.wait(2000);
  // Filter the newly created form
    cy.location('search').then(search => {
      //let pathName = fullUrl.pathname
    let arr = search.split('=');
    let arrayValues = arr[1].split('&');
    cy.log(arrayValues[0]);
    cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
    cy.waitForLoad();
    const formId_new = `${arrayValues[0]}`;
    cy.log(formId_new);
    let formId;
    //Cypress.env('formId', formId_new); // store it for later in same run
    cy.writeFile('cypress/fixtures/formId.json', { formId: formId_new });
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
      cy.get('.mx-2 > .v-btn').click();
    })
      //Draft submission and verification
    cy.readFile('cypress/fixtures/formId.json').then(({ formId }) => {
    cy.visit(`/${depEnv}/form/submit?f=${formId}`);
    cy.waitForLoad();
    cy.get('button').contains('Submit').should('be.visible');
    cy.waitForLoad();
    cy.waitForLoad();
    cy.contains('Text Field').click();
    cy.contains('Text Field').type('Alex');
    cy.get('.mt-6 > :nth-child(1) > .v-btn > .v-btn__content > span').click();
    cy.get('div > .bg-primary').click();
    cy.get('.v-data-table__tr > :nth-child(4)').contains('DRAFT');
    //Verify draft delete button exist
    cy.get('[icon-size="x-small"] > .v-btn').should('be.exist');
    //View column management
    cy.get('.mdi-view-column').click();
    cy.get('[data-test="filter-search"]').type('Status');
    //Remove Status column from draft submission table
    cy.get('input[type="checkbox"]').then($el => {

      const rem=$el[1];
      cy.get(rem).click();

    });
    //Verify Status column is removed from submission table
    cy.get('[data-test="save-btn"] > .v-btn__content').click();
    cy.get('.v-data-table__tr > :nth-child(4)').contains('DRAFT').should('not.exist');
    cy.get('.mdi-pencil').click();
    cy.get(':nth-child(4) > .v-btn').click();
    cy.waitForLoad();
    cy.get('.v-alert__content > div').contains('Draft Saved');
    // Edit draft submission
    cy.wait(4000);
    cy.get('.mt-6 > :nth-child(1) > .v-btn > .v-btn__content > span').click();
    cy.get('.mdi-pencil').click();
    cy.waitForLoad();
    //Form submission
    cy.contains('Text Field').click();
    cy.contains('Text Field').type('{selectall}{backspace}');
    cy.contains('Text Field').type('Nancy');
    cy.get('button').contains('Submit').click();
    cy.waitForLoad();
    cy.get('[data-test="continue-btn-continue"]').click({force: true});
    cy.waitForLoad();
    cy.location('pathname').should('eq', `/${depEnv}/form/success`);
    cy.contains('h1', 'Your form has been submitted successfully');
    cy.get('.mt-6 > :nth-child(1) > .v-btn > .v-btn__content > span').click();
    //Verify status column removed
    cy.get('.v-data-table__tr > :nth-child(4)').contains('SUBMITTED').should('not.exist');
    //Verify multiple draft upload functionality
    cy.visit(`/${depEnv}/form/submit?f=${formId}`);
    cy.waitForLoad();
    });
    cy.get('button').contains('Submit').should('be.visible');
    cy.waitForLoad();
    cy.waitForLoad();
    cy.get('button[title="Switch to multiple submissions"]').click();
    cy.get('h1').contains('Select JSON file to upload').click();
    let fileUploadInputField = cy.get('input[type=file]');
    cy.get('input[type=file]').should('not.to.be.null');
    fileUploadInputField.attachFile('test_schema.json');
    cy.get('.v-alert__content').contains('Wrong json file format').should('be.visible');
    cy.get('h1').contains('Select JSON file to upload').click();
    cy.get('input[type=file]').attachFile('test_submissions.json');
    cy.wait(1000);
    //Upload sucessful message
    cy.get('.v-alert__content').contains('Your multiple draft upload has been successful!').should('be.visible');
    cy.wait(1000);
    //Verify download template link
    cy.get('i[class="mdi-download mdi v-icon notranslate v-theme--chefsTheme v-icon--size-default mr-1"]').should('exist');
    //Verify Draft upload
    cy.contains('p',' Your multiple draft upload has been successful!').should('exist');
    cy.get('.mt-6 > :nth-child(1) > .v-btn > .v-btn__content > span').click();
    //Verify draft uploaded
    cy.get('button[title="Edit This Draft"]').then($el => {
      const rem=$el[0];
      cy.get(rem).click();
    })
    //Edit the uploaded draft
    cy.get('input[name="data[simpletextfield]"]').should('have.value', 'simple').should('exist');
    cy.contains('Text Field').type('{selectall}{backspace}');
    cy.contains("Text Field").type("Edit uploaded draft");
      //form submission
    cy.get("button").contains("Submit").click();
    cy.waitForLoad();
    cy.get('[data-test="continue-btn-continue"]').click({ force: true });
    cy.wait(2000);
    });

  });
    
});