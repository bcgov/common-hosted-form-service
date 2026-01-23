import 'cypress-keycloak-commands';

const depEnv = Cypress.env('depEnv');
const username=Cypress.env('keycloakUsername');
const password=Cypress.env('keycloakPassword');


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
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });  
// Publish a simple form with Simplebc Address component
 it('"Verify export submission', () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    cy.visit(`/${depEnv}`); 
    cy.get('#logoutButton > .v-btn__content > span').should('not.exist');
    cy.get('[data-test="base-auth-btn"] > .v-btn > .v-btn__content > span').click();
    cy.get('[data-test="idir"]').click();
    cy.get('#user').type(username);
    cy.get('#password').type(password);
    cy.get('.btn').click();
    cy.readFile('cypress/fixtures/formId.json').then(({ formId }) => {
    cy.visit(`/${depEnv}/form/manage?f=${formId}`);
    cy.wait(2000);
    cy.get(".mdi-list-box-outline").click();
    cy.waitForLoad();
    //Verify submission file name
    cy.get("h3").then(($elem) => {
      const rem = $elem.text();
      cy.log(rem);
      const remname = rem + "_submissions.json";
      cy.wait(2000);
      cy.get(".mdi-download").click({ force: true });
      cy.wait(2000);
      cy.get(".ml-1").contains(remname);
    });
    
    cy.get(':nth-child(2) > .v-col > .v-input > .v-input__control > .v-selection-control-group > :nth-child(2) > .v-label > .radioboxLabelStyle').click();
    cy.get('.v-col > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').contains('1');
    cy.contains('form.submissionId').should('be.visible');
    cy.contains('form.confirmationId').should('be.visible');
    cy.contains('form.formName').should('be.visible');
    cy.contains('form.version').should('be.visible');
    cy.contains('form.createdAt').should('be.visible');
    cy.contains('form.fullName').should('exist');
    cy.contains('form.username').should('exist');
    cy.contains('form.email').should('exist');

    cy.get('.v-input.mt-3 > .v-input__control > .v-field').type('status');
    cy.contains('form.status').should('be.visible');
    cy.contains('form.submissionId').should('not.exist');
    cy.contains('form.confirmationId').should('not.exist');
    cy.contains('form.formName').should('not.exist');
    cy.contains('form.version').should('not.exist');
    cy.contains('form.createdAt').should('not.exist');
    //Close filter option
    cy.get('.mdi-close-circle').click();
    cy.contains('form.submissionId').should('be.visible');
    cy.contains('form.confirmationId').should('be.visible');
    cy.contains('form.formName').should('be.visible');
    cy.contains('form.version').should('be.visible');
    cy.contains('form.createdAt').should('be.visible');
    //Select Date range
    cy.get('input[type="radio"]').then($el => {

        const rem=$el[3];
        const rem1=$el[4];
        cy.get(rem).click();
        //Default first Radio button for csv format is enabled
        cy.get(rem1).should('be.checked');
  
      });
    //verify csv format options
    cy.get('input[type="date"]').should('have.length',2);
    cy.get('span').contains('1 - Multiple rows per submission with indentation spaces');
    cy.get('span').contains('2 - Multiple rows per submission');
    cy.get('span').contains('3 - Single row per submission');
    cy.get('span').contains('4 - Unformatted');
    cy.get("h3").then(($elem) => {
        const rem = $elem.text();
        cy.log(rem);
        const remname = rem + "_submissions.csv";
        cy.get(".ml-1").contains(remname);
      });
    //verify export button is enabled
    cy.get('.mb-5').should('be.enabled');
  });
  });

  it("Verify print template functionality", () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    cy.get(".mdi-list-box-outline").click();
    cy.wait(2000);
    cy.get(':nth-child(1) > :nth-child(8) > a > .v-btn').click();
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
    cy.get('input[type="checkbox"]').should('not.be.checked');
    cy.get('input[type="checkbox"]').click();
    cy.get('input[type="checkbox"]').should('be.checked');
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
    cy.get('.mdi-close-circle').then($el => {
    const close_btn=$el[1];
    cy.get(close_btn).click();
    });
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
    cy.get('.mb-5 > .v-btn__content > span').contains('Export').should('be.visible');
    //Verify export button is enabled
    cy.get('.mb-5').should('be.enabled');
    //Validate form version is selected and visible
    cy.get('input[value="csv"]').click();
    cy.get('span[class="v-select__selection-text"]').then($el => {
    const rem=$el[0];
    //Verfiy form version is selected
    cy.get(rem).contains('1');
    });
    cy.get('#logoutButton > .v-btn__content > span').click();
  
  });
});