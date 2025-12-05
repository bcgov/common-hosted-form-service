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
    // Clear any persisted localStorage (e.g., autosave) between runs
    cy.clearLocalStorage();
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
      cy.get('span.btn').contains('Text Field')
      
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -110, { force: true })
      .trigger('mouseup', { force: true });
      cy.get('.btn-success').click();
    });
    //Multiline Text
    cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('span.btn').contains('Multi-line Text')
        
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -110, { force: true })
        .trigger('mouseup', { force: true });
        cy.get('.btn-success').click();
    });
    // Form saving
  });
  it("Form Submission and Updation", () => {
    cy.viewport(1000, 1100);
    cy.wait(2000);
    // Form saving
    let savedButton = cy.get("[data-cy=saveButton]");
    expect(savedButton).to.not.be.null;
    savedButton.trigger("click");
    cy.wait(2000);
    // Filter the newly created form
    cy.location("search").then((search) => {
      let arr = search.split("=");
      let arrayValues = arr[1].split("&");
      cy.log(arrayValues[0]);
      cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
      cy.waitForLoad();
      //Publish the form
      cy.get(".v-label > span").click();
      cy.get("span").contains("Publish Version 1");
      cy.contains("Continue").should("be.visible");
      cy.contains("Continue").trigger("click");
      //Submit the form
      cy.visit(`/${depEnv}/form/submit?f=${arrayValues[0]}`);
      cy.wait(2000);
      cy.get("button").contains("Submit").should("be.visible");
      cy.wait(2000);
      cy.contains("Text Field").click();
      cy.contains("Text Field").type("Alex");
      //form submission
      cy.get("button").contains("Submit").click();
      cy.waitForLoad();
      cy.get('[data-test="continue-btn-continue"]').click({ force: true });
      cy.wait(2000);
      cy.get("label").contains("Text Field").should("be.visible");
      cy.get("label").contains("Text Field").should("be.visible");
      cy.location("pathname").should("eq", `/${depEnv}/form/success`);
      cy.contains("h1", "Your form has been submitted successfully");
      cy.get('button[title="Email a receipt of this submission"]').should(
        "be.visible"
      );
      cy.get('button[title="Email a receipt of this submission"]').click();
      cy.get('[data-test="text-form-to"]')
        .find('input[type="text"]')
        .should("have.value", "chefs.testing@gov.bc.ca");
      cy.wait(1000);
      cy.get(
        ".v-form > .v-select > .v-input__control > .v-field > .v-field__append-inner > .mdi-menu-down"
      ).click();
      cy.contains("Normal").should("exist");
      cy.contains("High").should("exist");
      cy.contains("Low").should("exist");
      cy.get(
        ".v-form > .v-select > .v-input__control > .v-field > .v-field__append-inner > .mdi-menu-down"
      ).click();
      cy.get("span").contains("SEND").should("be.visible");
      cy.get('[data-test="continue-btn-cancel"]').click();
      cy.get('button[title="Email a receipt of this submission"]').click();
      cy.get("span").contains("SEND").click();
      cy.get(".v-alert__content")
        .contains("div", "An email has been sent to chefs.testing@gov.bc.ca.")
        .should("be.visible");
      //Recall submission
      cy.get('button[title="Recall Submission"]').should("be.visible");
      cy.get('button[title="Recall Submission"]').click();
      cy.wait(1000);
      //Update form
      cy.get('input[name="data[simpletextfield]"]').click();
      cy.get('input[name="data[simpletextfield]"]').type(
        "{selectall}{backspace}"
      );
      cy.get('input[name="data[simpletextfield]"]').type("Recalled");
      //Verify submission has revision status after recall
      cy.get(".mt-6 > :nth-child(1) > .v-btn").click();
      cy.get(".v-data-table__tr > :nth-child(4)")
        .contains("REVISING")
        .should("be.visible");
      cy.get(".v-data-table__tr > :nth-child(2)").should("exist");
      //Update recalled form and resubmit
      cy.get('button[title="View This Submission"]').click();
      cy.get('button[title="Edit this Draft"]').click();
      //Update form
      cy.get('input[name="data[simpletextfield]"]').click();
      cy.get('input[name="data[simpletextfield]"]').type(
        "{selectall}{backspace}"
      );
      cy.get('input[name="data[simpletextfield]"]').type("Nancy");
      //form submission
      cy.get("button").contains("Submit").click();
      cy.waitForLoad();
      cy.get('[data-test="continue-btn-continue"]').click({ force: true });
      cy.wait(2000);
      //view submission
      cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
      cy.wait(2000);
      cy.get(".mdi-list-box-outline").click();
      cy.wait(2000);
      cy.waitForLoad();
      cy.get('input[type="checkbox"]').then(($el) => {
        const rem = $el[0];
        rem.click();
        const rem1 = $el[1];
        cy.get(".v-data-table__tr > :nth-child(2)").should("not.exist");
        rem.click();
        rem1.click();
        cy.get(".v-data-table__tr > :nth-child(2)").should("not.exist");
        cy.wait(2000);
        cy.get(rem).click({ force: true });
        //submission delete verification
        cy.get('button[title="Delete Submission"]').click();
        cy.get('[data-test="continue-btn-continue"]').click();
        cy.get(".v-alert__content")
          .contains("div", "Submission deleted successfully.")
          .should("be.visible");
        cy.get(rem).click({ force: true });
        //Submission restore verification
        cy.get(".v-btn > .v-btn__content > .mdi-minus").should("not.exist");
        cy.get(
          ":nth-child(2) > .v-btn > .v-btn__content > .mdi-delete-restore"
        ).click();
        cy.get(
          '[data-test="continue-btn-continue"] > .v-btn__content > span'
        ).click();
        cy.get(".v-data-table__tr > :nth-child(2)").should("not.exist");
        cy.get(rem).click({ force: true });
        cy.get(".v-data-table__tr > :nth-child(2)").should("exist");
      });
      cy.get(":nth-child(1) > :nth-child(7) > a > .v-btn").click();
      //Change status to "Assigned" to edit submission data
      cy.get(".status-heading > .mdi-chevron-right").click();
      cy.get(
        '[data-test="showStatusList"] > .v-input__control > .v-field > .v-field__field > .v-field__input'
      ).click();
      cy.waitForLoad();
      cy.contains("ASSIGNED").click();
      cy.get(
        '[data-test="updateStatusToNew"] > .v-btn__content > span'
      ).click();
      cy.wait(1000);
      //Edit submission
      cy.get(".mdi-pencil").click();
      //check visibility of cancel button
      cy.get(".v-col-2 > .v-btn").should("be.visible");
      cy.get("button").contains("Submit").should("be.visible");
      //Validate input field value same as submission recall
      cy.get('input[name="data[simpletextfield]"]').should(
        "have.value",
        "Nancy"
      );
      //Edit submission data
      cy.contains("Text Field").click();
      cy.get('input[name="data[simpletextfield]"]').type(
        "{selectall}{backspace}"
      );
      cy.contains("Text Field").type("Smith");
      cy.get("button").contains("Submit").click();
      cy.waitForLoad();
      cy.get('[data-test="continue-btn-continue"]').click();
      cy.wait(2000);
      //Adding notes to submission
      cy.get(".mdi-plus").click();
      cy.get("div")
        .find("textarea")
        .then(($el) => {
          const rem = $el[0];
          rem.click();
          cy.get(rem).type("some notes");
        });
      cy.get('[data-test="canCancelNote"]').should("be.visible");
      cy.get('[data-test="btn-add-note"]').click();
      cy.get(".notes-text").contains("1");
      //Delete form after test run
      cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
      cy.waitForLoad();
      cy.waitForLoad();
      cy.get(".mdi-delete").click();
      cy.get('[data-test="continue-btn-continue"]').click();
      cy.get("#logoutButton > .v-btn__content > span").click();
    });
  });
});
