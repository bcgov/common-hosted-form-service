import "cypress-keycloak-commands";
import { formsettings } from "../support/login.js";

const depEnv = Cypress.env("depEnv");

Cypress.Commands.add("waitForLoad", () => {
  const loaderTimeout = 80000;

  cy.get(".nprogress-busy", { timeout: loaderTimeout }).should("not.exist");
});

describe("Form Designer", () => {
  cy.on("uncaught:exception", (err, runnable) => {
    // Form.io throws an uncaught exception for missing projectid
    // Cypress catches it as undefined: undefined so we can't get the text
    console.log(err);
    return false;
  });

  it("Visits the form settings page", () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    formsettings();
  });
  it('Getting page', () => {
    cy.viewport(1000, 1100);
    cy.get('div.builder-components.drag-container.formio-builder-form', { timeout: 30000 }).should('be.visible');
    cy.get('button').contains('BC Government').click();
    cy.wait(1000);
  });
  it("Add IDIR User Component", () => {
    cy.viewport(1000, 1100);
    cy.wait(1000);
    cy.get("div.formio-builder-form").then(($el) => {
      const coords = $el[0].getBoundingClientRect();
      cy.get('[data-type="idirusers"]')
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -600, { force: true })
      .trigger('mouseup', { force: true });
      cy.get('.btn-success').click();
      cy.wait(1000);
    });
    cy.get('button').contains('Basic Fields').click();
    cy.get('div.formio-builder-form').then($el => {
      const coords = $el[0].getBoundingClientRect();
      cy.get('span.btn').contains('Text Field')
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -110, { force: true })
      .trigger('mouseup', { force: true });
      cy.get('.btn-success').click();
    });
  });
  it('Verify Direct Print Configuration', () => {
    let savedButton = cy.get('[data-cy=saveButton]');
    expect(savedButton).to.not.be.null;
    savedButton.trigger('click');
    cy.wait(1000);
    // Filter the newly created form
    cy.location('search').then(search => {
      //let pathName = fullUrl.pathname
    let arr = search.split('=');
    let arrayValues = arr[1].split('&');
    cy.log(arrayValues[0]);
    cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
    cy.waitForLoad();
    //Publish the form
    cy.get('.v-label > span').click();
    cy.get('span').contains('Publish Version 1');
    cy.contains('Continue').should('be.visible');
    cy.contains('Continue').trigger('click');
    //Go to admin panel for feature settings
    cy.get('[data-cy="admin"]').click();
    cy.get('[value="features"] > .v-btn__content').click();
    cy.get('[data-test="featureFlags-table"] > .v-table__wrapper > table > tbody > :nth-child(1) > :nth-child(1)').
    contains('Document Generation V2').should('be.visible');
    cy.get('[data-test="featureFlags-table"] > .v-table__wrapper > table > tbody > :nth-child(1) > :nth-child(2)').
    contains('Existing document generation. Available to all forms.').
    should('be.visible');
    cy.get('[data-test="featureFlags-table"] > .v-table__wrapper > table > tbody > :nth-child(2) > :nth-child(1)').
    contains('Document Generation V3').should('be.visible');
    cy.get('[data-test="featureFlags-table"] > .v-table__wrapper > table > tbody > :nth-child(2) > :nth-child(2)').
    contains('Next-generation document generation (Carbone Enterprise).').should('be.visible');
    cy.get('[data-test="featureFlags-table"] > .v-table__wrapper > table > tbody > :nth-child(3) > :nth-child(1)').
    contains('Offline Forms').should('be.visible');
    cy.get('[data-test="featureFlags-table"] > .v-table__wrapper > table > tbody > :nth-child(3) > :nth-child(2)').
    contains('Allow forms to be completed and submitted while offline, syncing when a connection returns.').should('be.visible');
    cy.get('[data-test="featureFlags-table"] > .v-table__wrapper > table > tbody > :nth-child(4) > :nth-child(1)').
    contains('Submit to Email').should('be.visible');
    cy.get('[data-test="featureFlags-table"] > .v-table__wrapper > table > tbody > :nth-child(4) > :nth-child(2)').
    contains('Allow form submissions to be delivered to a configured email address.').should('be.visible');
    //Check all features enabled to every forms(Universal)
    cy.get('input[type="checkbox"]').should('have.length', 5);
    //Manage button exist for all features
    cy.get('[data-test="featureFlags-manage-documentGenerationV2"]').should('be.visible');
    cy.get('[data-test="featureFlags-manage-documentGenerationV3"]').should('be.visible');
    cy.get('[data-test="featureFlags-manage-offlineForms"]').should('be.visible');
    cy.get('[data-test="featureFlags-manage-submitToEmail"]').should('be.visible');
    //Set up a form to use DocumentGenerationV3
    cy.get('[data-test="featureFlags-manage-documentGenerationV3"]').click();
    cy.get('[data-test="featureFlags-form-input"] input').type(arrayValues[0]);
    cy.get('[data-test="featureFlags-form-add"]').click();
    cy.get('code').contains(arrayValues[0]).should('be.visible');
    cy.get('.v-card-actions > div > .v-btn').should('be.visible').click();
    //Delete the form from DocumentGenerationV3 feature
    cy.get('[data-test="featureFlags-manage-documentGenerationV3"]').click();
    cy.get('.mdi-delete').click({ multiple: true });
    cy.contains(arrayValues[0]).should('not.exist');
    //Save the changes
    cy.get('.v-card-actions > div > .v-btn').should('be.visible').click();
    //Check all features enabled back to every forms(Universal)
    cy.get('input[type="checkbox"]').should('have.length', 6);
    //Enable submit to email feature for the form
    cy.get('input[type="checkbox"]').eq(4).check({ force: true });
    //Configure submit to Email export
    cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
    cy.get('[data-test="canAllowEditFormSettings"]').click();
    cy.get('[data-test="submission-package-email-test"]').click();
    cy.get('[data-test="submission-package-email-test"]').parent().find('input[type="text"]').eq(1).type('test@example.com').type('{enter}');
    let SubmitToEmail = cy.get('input[type=file]');
    cy.get('input[type=file]').should('not.to.be.null');
    SubmitToEmail.attachFile('test.docx');
    cy.get('button[title="Upload"]').click({force: true});
    cy.wait(500);
    cy.contains('tr', 'test.docx').find('input[type="radio"]').check();
    cy.get('[data-test="canEditForm"]').click({ force: true });
    //Validate codogs file uploaded appears under cdogs section
    cy.get(':nth-child(3) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay').click();
    cy.contains('span','test.docx').should('be.visible');
    cy.get(':nth-child(5) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay').click();
    cy.get('input[type="radio"][value="default"]').should('be.checked');
    cy.get('input[type="radio"][aria-label="Direct Print"]').should('not.be.checked');
    cy.get('input[type="radio"][aria-label="Direct Print"]').click();
    cy.wait(500);
    cy.get('.pl-12 > .v-text-field > .v-input__control > .v-field > .v-field__append-inner').click();
    cy.wait(1000);
    cy.get('div.v-list-item-title').contains('test.docx').click();
    cy.get('input[type="radio"][value="formName"]').should('be.checked');
    cy.get('input[type="radio"][value="custom"]').should('not.be.checked');
    cy.get('input[type="radio"][value="custom"]').check({ force: true });
    cy.wait(500);
    cy.contains('label', 'Custom File Name')   // find the label with the text
      .invoke('attr', 'for')                   // get the "for" attribute (input ID)
      .then((inputId) => {
        cy.get(`#${inputId}`).type('My Custom File Name')  // type into the input
    })
    //Save print settings
    cy.get('button[title="Save Configuration"]').click();
    cy.get('.v-alert__content').contains('Print configuration saved successfully').should('be.visible');
    cy.wait(500);
    //Submit the form
    cy.visit(`/${depEnv}/form/submit?f=${arrayValues[0]}`);
    cy.wait(1000);
    cy.get('input[placeholder="Search by first name"]').type("CHEFS");
    cy.get('input[placeholder="Search by email"]').type("chefs.testing@gov.bc.ca");
    //Search button
    cy.get('.col-md-12 > .btn').click();
    cy.get('.search-results > tr > :nth-child(3)').contains('chefs.testing@gov.bc.ca').should('be.visible');
    cy.get('.search-results > tr > :nth-child(2)').contains('CHEFS').should('be.visible');
    //Select serach item
    cy.get(':nth-child(4) > .btn').click();
    cy.get('.selected-user-info > :nth-child(1)').contains(' CHEFS Testing (CHEFSTST) CITZ:EX').should('be.visible');
    cy.contains('strong', 'Username:') .parent().should('contain', 'CHEFSTST');
    //clear selection
    cy.get('.alert > .btn').click();
    cy.get('.selected-user-info > :nth-child(1)').contains(' CHEFS Testing (CHEFSTST) CITZ:EX').should('not.be.visible');
    cy.get('input[placeholder="Search by email"]').type("chefs.testing@gov.bc.ca");
    //Search button
    cy.get('.col-md-12 > .btn').click();
    cy.get(':nth-child(4) > .btn').click();
    cy.get('.selected-user-info > :nth-child(1)').contains(' CHEFS Testing (CHEFSTST) CITZ:EX').should('be.visible');
    cy.get('button').contains('Submit').click();
    cy.get('[data-test="continue-btn-continue"]').click({ force: true });
    cy.wait(1000);
    cy.get('.selected-user-view > :nth-child(1)').contains('CHEFS Testing (CHEFSTST) CITZ:EX').should('be.visible');
    //Direct Print Verification
    cy.wait(2000);
    cy.get('.mdi-printer').should('be.visible').click();
    cy.wait(1000);
    cy.get('.v-alert__content').contains('Document generated successfully').should('be.visible');
    });

   });

});
