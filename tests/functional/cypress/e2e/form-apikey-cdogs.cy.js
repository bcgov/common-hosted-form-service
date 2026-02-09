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
    cy.checkA11yPage();
  });
  it('Getting page ready', () => {
    cy.viewport(1000, 1100);
    cy.get('button').contains('BC Government').click();   
  });
  it('checks Data Retention Settings', () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    cy.get('div.formio-builder-form').then($el => {
      const coords = $el[0].getBoundingClientRect();
      cy.get('[data-key="simplebcaddress"]')
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -550, { force: true })
        //.trigger('mousemove', coords.y, +100, { force: true })
      .trigger('mouseup', { force: true });
      cy.wait(1000); 
      cy.get('.btn-success').click();
    });
    // Form saving
    cy.wait(2000); 
    let savedButton = cy.get('[data-cy=saveButton]');
    expect(savedButton).to.not.be.null;
    savedButton.trigger('click');
    cy.wait(2000);
    //Publish the form
    cy.get('.mdi-dots-vertical').click();
    cy.get('[data-cy="publishRouterLink"] > .v-btn > .v-btn__content').click();
    cy.get('span').contains('Publish Version 1');
    cy.contains('Continue').should('be.visible');
    cy.contains('Continue').trigger('click');
    //Update form design version
    cy.get('.mdi-plus').click();
    //Add new component to version 1
    cy.get('div.formio-builder-form').then($el => {
    const coords = $el[0].getBoundingClientRect();
    cy.get('span.btn').contains('Columns - 2')
    .trigger('mousedown', { which: 1}, { force: true })
    .trigger('mousemove', coords.x, -140, { force: true })
    .trigger('mouseup', { force: true });
    cy.get('.btn-success').click();
    });
     // Form saving
    cy.wait(1000); 
    cy.get('[data-cy=saveButton]').click();
    cy.wait(2000);
    cy.get('.mdi-dots-vertical').click();
    cy.get('[data-cy="settingsRouterLink"] > .v-btn > .v-btn__content').click();
    cy.get('span').contains('Please publish or delete your latest draft version before starting a new version.').should('exist');
    cy.get('.mdi-plus').should('not.be.enabled');
    cy.get('button[title="Delete Version"]').should('be.visible');
    cy.get('button[title="Delete Version"]').click();
    cy.get('span').contains('Are you sure you wish to delete this Version?').should('be.visible');
    cy.get('button').contains('Delete').should('be.visible').click();
    cy.get('button[title="Delete Version"]').should('not.exist');
    //Update form design version
    cy.get('.mdi-plus').click();
    cy.get('div.formio-builder-form').then($el => {
    const coords = $el[0].getBoundingClientRect();
    cy.get('span.btn').contains('Columns - 3')
    .trigger('mousedown', { which: 1}, { force: true })
    .trigger('mousemove', coords.x, -140, { force: true })
    .trigger('mouseup', { force: true });
    cy.get('.btn-success').click();
    });
    //Form saving
    cy.wait(1000); 
    cy.get('[data-cy=saveButton]').click();
    cy.wait(1000);
    cy.get('.mdi-dots-vertical').click();
    cy.get('[data-cy="settingsRouterLink"] > .v-btn > .v-btn__content').click();
    cy.wait(500);
    cy.get(':nth-child(2) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay').click();
    cy.get('[data-test="canAllowEditFormSettings"] > .v-btn__content > .mdi-pencil').click();
    cy.get(':nth-child(2) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay').click();
    cy.get('[data-test="enableHardDeletionCheckbox"]').click();
    cy.get(':nth-child(2) > .v-combobox > .v-input__control > .v-field > .v-field__append-inner > .mdi-menu-down').click();
    cy.get('span.v-combobox__selection-text').contains('Public').should('exist');
    cy.contains('Public').should('exist');
    cy.contains('Sensitive').should('exist');
    cy.contains('Protected').should('exist');
    cy.contains('Confidential').should('exist');
    cy.wait(1000);
    cy.get('.v-alert__content > span').contains('WARNING: After 30 days, submissions marked for deletion will be permanently deleted and cannot be recovered.').should('exist');
    cy.contains('Sensitive').click();
    cy.get(':nth-child(2) > .v-select > .v-input__control > .v-field > .v-field__field > .v-field__input > .v-select__selection > .v-select__selection-text').contains('Custom period').should('exist');
    cy.contains('label', 'Custom Retention Period (days)').next('input[type="number"]').should('have.value', '30');
    cy.contains('label', 'Custom Retention Period (days)').next('input[type="number"]').clear().type('60');
    cy.contains('label', 'Classification Notes').next('textarea').type('some privacy issues');
    cy.get('.v-alert__content > span').contains('WARNING: After 60 days, submissions marked for deletion will be permanently deleted and cannot be recovered.').should('exist');
    cy.get(':nth-child(2) > .v-select > .v-input__control > .v-field > .v-field__append-inner > .mdi-menu-down').click();
    cy.contains('90 days').should('exist');
    cy.contains('180 days').should('exist');
    cy.contains('1 year (365 days)').should('exist');
    cy.contains('5 years (1825 days)').should('exist');
    cy.contains('2 years (730 days)').should('exist');
    cy.contains('2 years (730 days)').click();
    cy.get('.v-alert__content > span').contains('WARNING: After 730 days, submissions marked for deletion will be permanently deleted and cannot be recovered.').should('be.visible');
    cy.get('[data-test="canEditForm"] > .v-btn__content > span').click();
    cy.wait(2000); 
  });     
  it('checks Apikey Settings', () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    cy.get(':nth-child(2) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay').click();
    cy.get('[data-test="canGenerateAPIKey"]').click();
    cy.get('[data-test="continue-btn-continue"]').click();
    cy.get('[data-test="continue-btn-cancel"]').should('be.enabled');
    cy.get('[data-test="canAllowCopyAPIKey"]').click();
    //Verify checkbox checked for access submitted files
    cy.contains('Allow this API key to access submitted files').click();
    cy.get('input[aria-label="Allow this API key to access submitted files"]').should('be.checked');
    //Delete Apikey
    cy.get('[data-test="canDeleteApiKey"]').click();
    cy.get('[data-test="continue-btn-continue"]').click();
    cy.get('.v-alert__content').contains('div','The API Key for this form has been deleted.').should('be.visible');


  });
  it('checks Cdogs Upload', () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    cy.get(':nth-child(3) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay').click();
    let fileUploadInputField = cy.get('input[type=file]');
    cy.get('input[type=file]').should('not.to.be.null');
    fileUploadInputField.attachFile('add1.png');
    // Checking file type functionality
    cy.get('div').contains('The template must use one of the following extentions: .txt, .docx, .html, .odt, .pptx, .xlsx').should('be.visible');
    cy.get('input[type=file]').should('not.to.be.null');
    fileUploadInputField.attachFile('SamplePPTx.pptx');
    cy.get('div').contains('The template must use one of the following extentions: .txt, .docx, .html, .odt, .pptx, .xlsx').should('not.exist');
    cy.waitForLoad();
    cy.get('button[title="Upload"]').click();
    cy.wait(2000);    
    cy.get('.mdi-minus-circle').click();
    cy.get('input[type=file]').should('not.to.be.null');
    fileUploadInputField.attachFile('file_example_XLSX_50.xlsx');
    cy.waitForLoad();
    cy.get('button[title="Upload"]').click();
    cy.get('.mdi-minus-circle').click();
    cy.get('input[type=file]').should('not.to.be.null');
    fileUploadInputField.attachFile('Testing_files.txt');
    cy.get('button[title="Upload"]').click();
    cy.get('.mdi-minus-circle').click();
    cy.get('input[type=file]').should('not.to.be.null');
    fileUploadInputField.attachFile('test.docx');
    cy.contains('div','test.docx (11.9 kB)').should('be.visible');
    cy.get('button[title="Upload"]').click();
    cy.contains('span','test.docx').should('be.visible');
    cy.contains('div','test.docx (11.9 kB)').should('not.exist');
    // Verify cdogs template uplaod success message
    cy.get('.v-alert__content').contains('div','Template uploaded successfully.').should('be.visible');
    //Delete form after test run
    cy.get('[data-test="canRemoveForm"]').click();
    cy.get('[data-test="continue-btn-continue"]').click();

  });

})
