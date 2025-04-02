import "cypress-keycloak-commands";
import { formsettings } from "../support/login.js";

const depEnv = Cypress.env("depEnv");

Cypress.Commands.add("waitForLoad", () => {
  const loaderTimeout = 60000;

  cy.get(".nprogress-busy", { timeout: loaderTimeout }).should("not.exist");
});
describe("Form Designer", () => {
  beforeEach(() => {
    cy.on("uncaught:exception", (err, runnable) => {
      // Form.io throws an uncaught exception for missing projectid
      // Cypress catches it as undefined: undefined so we can't get the text
      console.log(err);
      return false;
    });
  });
  it("Visits the form settings page", () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    formsettings();
  });
  it("Add some fields for submission", () => {
    cy.viewport(1000, 1800);
    cy.waitForLoad();
    cy.get("button").contains("Basic Fields").click();
    cy.get("div.formio-builder-form").then(($el) => {
      const coords = $el[0].getBoundingClientRect();
      cy.get("span.btn")
        .contains("Text Field")

        .trigger("mousedown", { which: 1 }, { force: true })
        .trigger("mousemove", coords.x, -50, { force: true })
        .trigger("mouseup", { force: true });
      cy.get("button").contains("Save").click();
    });
    // Form saving
  });
  it("Form Submission and Updation", () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    cy.waitForLoad();
    cy.intercept("GET", `/${depEnv}/api/v1/forms/*`).as("getForm");
    // Form saving
    let savedButton = cy.get("[data-cy=saveButton]");
    expect(savedButton).to.not.be.null;
    savedButton.trigger("click");
    cy.waitForLoad();

    // Go to My forms
    cy.wait("@getForm").then(() => {
      let userFormsLinks = cy.get("[data-cy=userFormsLinks]");
      expect(userFormsLinks).to.not.be.null;
      userFormsLinks.trigger("click");
    });
    // Filter the newly created form
    cy.location("search").then((search) => {
      let arr = search.split("=");
      let arrayValues = arr[1].split("&");
      cy.log(arrayValues[0]);
      cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
      cy.wait(6000);
      //Publish the form
      cy.get(".v-label > span").click();

      cy.get("span").contains("Publish Version 1");

      cy.contains("Continue").should("be.visible");
      cy.contains("Continue").trigger("click");
      //Submit the form
      cy.visit(`/${depEnv}/form/submit?f=${arrayValues[0]}`);
      cy.waitForLoad();
      cy.waitForLoad();
      cy.waitForLoad();
      cy.get("button").contains("Submit").should("be.visible");
      cy.waitForLoad();
      cy.waitForLoad();
      cy.contains("Text Field").click();
      cy.contains("Text Field").type("Alex");
      //form submission
      cy.get("button").contains("Submit").click();
      cy.waitForLoad();
      cy.get('[data-test="continue-btn-continue"]').click({ force: true });
      cy.waitForLoad();
      cy.waitForLoad();
      cy.waitForLoad();
      cy.get("label").contains("Text Field").should("be.visible");
      cy.get("label").contains("Text Field").should("be.visible");
      cy.location("pathname").should("eq", `/${depEnv}/form/success`);
      cy.contains("h1", "Your form has been submitted successfully");
      cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
      cy.waitForLoad();
      cy.waitForLoad();
      cy.waitForLoad();
      cy.visit(`/${depEnv}/form/submit?f=${arrayValues[0]}`);
      cy.wait(2000);
      cy.get("button").contains("Submit").should("be.visible");
      cy.waitForLoad();
      cy.contains("Text Field").click();
      cy.contains("Text Field").type("Alex");
      cy.get("button").contains("Submit").click();
      cy.waitForLoad();
      cy.get('[data-test="continue-btn-continue"]').should("be.visible");
      cy.get('[data-test="continue-btn-continue"]').should("exist");
      cy.get('[data-test="continue-btn-continue"]').click({ force: true });
      cy.location("pathname").should("eq", `/${depEnv}/form/success`);
      cy.contains("h1", "Your form has been submitted successfully");
      cy.waitForLoad();
      //view submission
      cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
      cy.wait(2000);
    });
  });
  it("Verify export submission", () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    cy.get(".mdi-list-box-outline").click();
    cy.waitForLoad();
    //Export submission files
    
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

  it("Verify print template functionality", () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    cy.get(".mdi-list-box-outline").click();
    cy.wait(2000);
    cy.get(':nth-child(1) > :nth-child(6) > a > .v-btn').click();
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
    //
    cy.waitForLoad();
    //Upload print template
    cy.get('.v-slide-group__content > [tabindex="-1"]').click();
    cy.get('[tabindex="-1"] > .v-btn__content').click();
    cy.waitForLoad();
    cy.get('.mdi-close-circle').click();
    cy.get('input[type=file]').attachFile('test.docx');
    cy.waitForLoad();
    //cy.get('.v-selection-control-group > .v-input--dirty > .v-input__control > .v-field > .v-field__append-inner > .mdi-menu-down').click();
    cy.get('.v-selection-control-group > .v-text-field > .v-input__control > .v-field').click();
    cy.contains('pdf').should('be.visible');
    //cy.get('span').contains('docx').should('exist');
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

    //Delete form after test run
    cy.get('.mdi-list-box-outline').click();
    cy.location("search").then((search) => {
      let arr = search.split("=");
    cy.visit(`/${depEnv}/form/manage?f=${arr[1]}`);
    cy.waitForLoad();
    cy.get('.mdi-delete').click();
    cy.get('[data-test="continue-btn-continue"]').click();
    cy.get('#logoutButton > .v-btn__content > span').click();
    })
        
      
  });
});
