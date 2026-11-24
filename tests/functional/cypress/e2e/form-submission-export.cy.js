import 'cypress-keycloak-commands';

const depEnv = Cypress.env('depEnv');
const username=Cypress.env('keycloakUsername');
const password=Cypress.env('keycloakPassword');


Cypress.Commands.add('waitForLoad', () => {
  const loaderTimeout = 60000;

  cy.get('.nprogress-busy', { timeout: loaderTimeout }).should('not.exist');
});

describe('Form Designer', () => {
  let formId;

  before(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
    cy.viewport(1000, 1100);
    cy.visit(`/${depEnv}`);
    cy.checkA11yPage();
    cy.get('#logoutButton').should('not.exist');
    cy.get('#loginButton').click();
    cy.get('[data-test="idir"]').click();
    cy.get('#user').type(username);
    cy.get('#password').type(password, { log: false });
    cy.get('.btn').click();
    cy.get('#logoutButton', { timeout: 30000 }).should('be.visible');
    cy.readFile('cypress/fixtures/formId.json').its('formId').should('be.a', 'string').then((id) => {
      formId = id;
    });
  });

  beforeEach(() => {
    cy.viewport(1000, 1100);
    cy.on('uncaught:exception', (err) => {
      // Form.io can throw an uncaught exception for a missing projectid.
      console.log(err);
      return false;
    });
  });

  it('Verify export submission', () => {
    cy.visit(`/${depEnv}/form/manage?f=${formId}`);
    cy.get('[data-test="canViewFormSubmissions"]').click();
    cy.get('button[title="Export Submissions to Files"]').click();
    cy.contains('h1', 'Export Submissions to File').should('be.visible');
    cy.get('h3').invoke('text').should('not.be.empty').then((formName) => {
      cy.get('.fileLabelStyle .ml-1').should('have.text', `${formName.trim()}_submissions.json`);
    });

    cy.get('input[value="csv"]').check();
    cy.get('.v-select__selection-text').should('have.text', '1');
    cy.contains('form.submissionId').should('be.visible');
    cy.contains('form.confirmationId').should('be.visible');
    cy.contains('form.formName').should('be.visible');
    cy.contains('form.version').should('be.visible');
    cy.contains('form.createdAt').should('be.visible');
    cy.contains('form.fullName').should('exist');
    cy.contains('form.username').should('exist');
    cy.contains('form.email').should('exist');

    cy.get('input[placeholder="Search Fields"]').type('status');
    cy.contains('form.status').should('be.visible');
    cy.contains('form.submissionId').should('not.exist');
    cy.contains('form.confirmationId').should('not.exist');
    cy.contains('form.formName').should('not.exist');
    cy.contains('form.version').should('not.exist');
    cy.contains('form.createdAt').should('not.exist');
    cy.get('input[placeholder="Search Fields"]').clear();
    cy.contains('form.submissionId').should('be.visible');
    cy.contains('form.confirmationId').should('be.visible');
    cy.contains('form.formName').should('be.visible');
    cy.contains('form.version').should('be.visible');
    cy.contains('form.createdAt').should('be.visible');
    cy.contains('label', 'Select date range').click();
    cy.get('input[value="multiRowEmptySpacesCSVExport"]').should('be.checked');
    //verify csv format options
    cy.get('input[type="date"]').should('have.length',2);
    cy.get('span').contains('1 - Multiple rows per submission with indentation spaces');
    cy.get('span').contains('2 - Multiple rows per submission');
    cy.get('span').contains('3 - Single row per submission');
    cy.get('span').contains('4 - Unformatted');
    cy.get('h3').invoke('text').should('not.be.empty').then((formName) => {
      const fileName = `${formName.trim()}_submissions.csv`;
      cy.get('.fileLabelStyle .ml-1').should('have.text', fileName);
      cy.intercept('POST', `**/forms/${formId}/export/fields`).as('exportSubmissions');
      cy.get('button[title="Export"]').should('be.enabled').click();
      cy.wait('@exportSubmissions').its('response.statusCode').should('eq', 200);
      cy.readFile(`${Cypress.config('downloadsFolder')}/${fileName}`, { timeout: 30000 }).should('not.be.empty');
    });
  });

  it("Verify print template functionality", () => {
    cy.visit(`/${depEnv}/form/submissions?f=${formId}`);
    cy.get('button[title="View Submission"]').first().click();
     //print option
    cy.get('.mdi-printer').click();
    cy.get('.flex-container > .v-btn--elevated').should('be.enabled');
    cy.get('.text-textLink').should('be.enabled');
    cy.get('.text-textLink').click();
    cy.get('.v-overlay__content > .v-card').should('not.exist');
    cy.get('.mdi-printer').click();
    cy.get('.v-label > span').contains('Expand text fields');
    cy.get('.v-slide-group-item--active > .v-btn__content').contains('Browser Print');
    cy.get('[tabindex="-1"] > .v-btn__content').contains('Template Print');
    cy.contains('label', 'Expand text fields').closest('.v-selection-control').find('input[type="checkbox"]').should('be.checked');
    cy.get('.v-window-item--active > .flex-container > .more-info-link').should('exist');
    //print option for submission files
    cy.get('[tabindex="-1"] > .v-btn__content').click();
    let fileUploadInputField = cy.get('input[type=file]');
    cy.get('input[type=file]').should('not.to.be.null');
    fileUploadInputField.attachFile('add1.png');
    cy.waitForLoad();
    cy.get('label').contains('Upload template file').click({multiple:true,force:true});
    cy.get('.v-messages__message').contains('The template must use one of the following extentions: .txt, .docx, .html, .odt, .pptx, .xlsx');
    cy.get('#file-input-submit').should('not.be.enabled');
    cy.waitForLoad();
    //Upload print template
    cy.get('.v-slide-group__content > [tabindex="-1"]').click();
    cy.get('[tabindex="-1"] > .v-btn__content').click();
    cy.waitForLoad();
    //Remove the wrong file and upload the correct file
    cy.get('.mdi-close-circle').click();
    cy.get('input[type=file]').attachFile('test.docx');
    cy.waitForLoad();
    cy.get('.v-selection-control-group > .v-text-field > .v-input__control > .v-field').click();
    cy.contains('pdf').should('be.visible');
    cy.contains('pdf').click();
    cy.get('#file-input-submit').should('be.enabled');
    cy.get('.v-card-actions > .flex-container > .text-textLink').should('be.enabled');
    cy.get('.v-card-actions > .flex-container > .text-textLink').click();
    cy.get('.mdi-printer').click();
    cy.get('#file-input-submit').click({force: true});
    // Verify cdogs template uplaod success message
    cy.get('body').click(0,0);
    cy.wait(2000);
    cy.get('.v-alert__content').contains('Document generated successfully').should('be.visible');
    cy.get('.mdi-list-box-outline').click();
    //Manage form settings
    cy.get('.mdi-cog').click();
    cy.wait(2000);
    //Unpublish the form
    cy.get(".v-label > span").click();
    cy.get('.v-card-title > span').contains('Unpublish Version 1');
    cy.contains("Continue").should("be.visible");
    cy.contains("Continue").trigger("click");
    //Go to Export Submissions
    cy.get('.mdi-list-box-outline').click();
    cy.wait(2000);
    cy.get('.mdi-download').click();
    cy.wait(2000);
    cy.get('span').contains('Submission Date').should('be.visible');
    cy.get('button').contains('Export').should('be.visible');
    //Verify export button is enabled
    cy.get('.mb-5').should('be.enabled');
    //Validate form version is selected and visible
    cy.get('input[value="csv"]').click();
    cy.get('span[class="v-select__selection-text"]').then($el => {
    const rem=$el[0];
    //Verfiy form version is selected
    cy.get(rem).contains('1');
    });
    cy.get('.mdi-logout').click();

  
  });
});
