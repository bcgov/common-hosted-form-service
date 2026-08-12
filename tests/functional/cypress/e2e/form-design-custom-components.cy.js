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
    // Update Form settings for offline forms
    cy.get('[lang="en"] > .v-btn > .v-btn__content > .mdi-pencil').click();
    cy.wait(1000);
    let enableOfflineSubmissionCheckbox = cy.get('[data-test="enableOfflineSubmissionCheckbox"] input[type="checkbox"]');
    enableOfflineSubmissionCheckbox.check({ force: true });
    //Update form settings for offline forms
    cy.get('[data-test="canEditForm"]').click();
    //codogs file upload
    cy.get(':nth-child(3) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay').click();
    let fileUploadInputField = cy.get('input[type=file]');
    cy.get('input[type=file]').should('not.to.be.null');
    fileUploadInputField.attachFile('test.docx');
    cy.get('button[title="Upload"]').click();
    cy.wait(500);
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
    //Offline simulator check
    cy.visit(`/${depEnv}/form/submit?f=${arrayValues[0]}&simulateOffline=1`);
    cy.wait
    cy.get('[data-test="onlineBadge"]').should('be.visible');
    cy.get('[data-test="onlineBadge"]').should('be.visible').and('contain', 'ONLINE');
    cy.get('[data-test="simulateOfflineToggle"]').click();
    cy.get('[data-test="simulatingOfflineBadge"]').should('be.visible').and('contain', 'OFFLINE');
    cy.wait(1000);
    cy.contains('Text Field').click();
    cy.contains('Text Field').type('Smith');
    cy.get('button').contains('Submit').click();
    cy.get('input[placeholder="A short label to help you find this submission later"]').type('My offline Submission');
    cy.get('[data-test="queue-confirm-submit"]').click();
    cy.get('.v-alert__content').contains('Submission saved. It will be sent when you are back online.').should('be.visible');
    cy.contains('h1', 'Submission Saved').should('be.visible');
    cy.contains('span', '1').should('be.visible');
    cy.contains('button', 'Return to Form').should('be.visible');
    cy.get('.v-badge__badge > span').should('contain', '1');
    cy.get('.v-badge__badge').click();
    cy.contains('.pending-row-title', 'My offline Submission').should('be.visible');
    //Delete an offline submission from submission queue
    cy.get('button[title="Discard"]').click();
    cy.get('[data-test="pending-discard-confirm"]').should('be.visible');
    cy.get('[data-test="pending-discard-cancel"]').should('be.visible');
    cy.get('[data-test="pending-discard-confirm"]').click();
    //Confirms it is deleted from the submission queue
    cy.contains('.pending-row-title', 'My offline Submission').should('not.exist');
    cy.contains('span', 'Close').should('be.visible').click();
    cy.contains('span', '1').should('not.exist');
    cy.contains('button', 'Return to Form').should('be.visible').click();
    //Checks whether it goes back to original form
    cy.get('input[placeholder="Search by email"]').should('be.visible');
    cy.contains('Text Field').should('be.visible');
    cy.contains('Text Field').type('Smith');
    cy.get('button').contains('Submit').click();
    //Submit again with offline toggle
    cy.get('input[placeholder="A short label to help you find this submission later"]').type('My offline Submission');
    cy.get('[data-test="queue-confirm-submit"]').click();
    cy.get('.v-alert__content').contains('Submission saved. It will be sent when you are back online.').should('be.visible');
    cy.contains('h1', 'Submission Saved').should('be.visible');
    cy.contains('span', '1').should('be.visible');
    cy.contains('button', 'Return to Form').should('be.visible');
    cy.get('.v-badge__badge > span').should('contain', '1');
    //Enable online toggle and check if submission is sent
    cy.get('.mdi-cloud-check-outline').click({ force: true });
    cy.wait(2000);
    cy.contains('button', 'Return to Form').click();
    //Check on submission table if submission is sent and received
    cy.get('button[title="View My Drafts/Submissions"]').click();
    cy.get('[data-test="saveddelete-btn-cancel"] > .v-btn__content > span').click();
    cy.wait(1000);
    cy.get('.v-data-table__tr > :nth-child(4)').contains('SUBMITTED').should('be.visible');
    //Validate only one submission is present in the submission table
    cy.get('.v-data-table__tr').should('have.length', 1);
    //Submit the form
    cy.visit(`/${depEnv}/form/submit?f=${arrayValues[0]}`);
    cy.wait(1000);
    });
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
    //exit offline toggle
    cy.get('[data-test="simulateOfflineToggle"]').click();
    cy.wait(500);
    //Validate online badge is visible back
    cy.get('[data-test="onlineBadge"]').should('be.visible').and('contain', 'ONLINE');
    cy.wait(1000);
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
