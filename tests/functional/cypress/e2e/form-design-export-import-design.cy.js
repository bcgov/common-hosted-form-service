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
  // Publish a simple form with Simplebc Address component
  it("Checks Export/Import design functionality", () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    cy.get("button").contains("BC Government").click();
    cy.get("div.formio-builder-form").then(($el) => {
      const coords = $el[0].getBoundingClientRect();
      cy.get('[data-key="simplebcaddress"]')
        .trigger("mousedown", { which: 1 }, { force: true })
        .trigger("mousemove", coords.x, -550, { force: true })
        .trigger("mouseup", { force: true });
      cy.wait(2000);
      cy.get("button").contains("Save").click();
      cy.wait(2000);
    });
    cy.get(".mdi-publish").click();
    let fileUploadInputField = cy.get("input[type=file]");
    cy.get("input[type=file]").should("not.to.be.null");
    fileUploadInputField.attachFile("test_schema.json");
    cy.wait(2000);
    cy.get('input[name="data[simplebcaddress]"]').should("not.exist");
    cy.get(".mdi-download").click();
    cy.wait(2000);
    //Verifies design downloads into download folder
    cy.get("h3").then(($elem) => {
      const rem = $elem.text();
      let arr = rem.split(":");
      cy.log(arr);
      let remname = arr[1] + "_schema.json";
      cy.wait(2000);
      const path = require("path");
      const downloadsFolder = Cypress.config("downloadsFolder");
      cy.readFile(path.join(downloadsFolder, remname)).should("exist");
    });
    //Verify visibility of right side buttons on design page
    cy.get('[data-cy="saveButton"] > .v-btn').should("be.enabled");
    //Preview button disabled before form saving
    cy.get('[data-cy="previewRouterLink"] > .v-btn').should("be.visible");
    cy.get('[data-cy="previewRouterLink"] > .v-btn').should("not.be.enabled");
    cy.get('[data-cy="undoButton"] > .v-btn').should("be.enabled");
    cy.get('[data-cy="redoButton"] > .v-btn').should("not.be.enabled");
    cy.get(".mdi-undo").click();
    cy.get('[data-cy="redoButton"] > .v-btn').should("be.enabled");
    cy.get('[data-cy="redoButton"] > .v-btn').click();
    //Verify  existence of page top/bottom move button
    cy.get(".float-button > :nth-child(3) > .v-btn").should("be.enabled");
    cy.get(".float-button > :nth-child(3) > .v-btn").click();
    cy.get(".mdi-arrow-down").should("not.exist");
    cy.get(".mdi-arrow-up").should("exist");
    cy.get(".mdi-close").click();
    cy.get('[data-cy="saveButton"] > .v-btn').should("not.exist");
    cy.get(".mdi-undo").should("not.exist");
    cy.get(".mdi-redo").should("not.exist");
    cy.get(".mdi-menu").should("be.visible");
    cy.get(".mdi-arrow-up").should("be.visible");
    cy.get(".mdi-menu").click();
    // Form saving
    let savedButton = cy.get("[data-cy=saveButton]");
    expect(savedButton).to.not.be.null;
    savedButton.trigger("click");
    cy.wait(2000);
    //Preview button enabled
    cy.get('[data-cy="previewRouterLink"] > .v-btn').should("be.visible");
    cy.get('[data-cy="previewRouterLink"] > .v-btn').should("be.enabled");
    // Filter the newly created form
    cy.location("search").then((search) => {
      let arr = search.split("=");
      let arrayValues = arr[1].split("&");
      cy.log(arrayValues[0]);
      let dval = arr[2].split("&");
      cy.log(dval);
      //Form preview
      cy.visit(`/${depEnv}/form/preview?f=${arrayValues[0]}&d=${dval[0]}`);
      cy.waitForLoad();
      //Verify new design is updated in the form
      cy.get("label").contains("Select List").should("be.visible");
      cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
    });
  });
  it("Checks BCSC login settings on form Settings", () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    //Publish the form
    cy.get(".v-label > span").click();
    cy.get("span").contains("Publish Version 1");
    cy.contains("Continue").should("be.visible");
    cy.contains("Continue").trigger("click");
    cy.waitForLoad();
    cy.get(
      ":nth-child(1) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay"
    ).click();
    cy.get('[lang="en"] > .v-btn > .v-btn__content > .mdi-pencil').click();
    cy.get(
      '[data-test="userType"] > .v-input__control > .v-field > .v-field__field > .v-field__input'
    ).click();
    cy.contains("Log-in Required").click();
    cy.contains("BC Services Card").click();
    cy.waitForLoad();
    //Validate checkbox settings for BC SC card login on form settings page
    cy.get('[data-test="canSaveAndEditDraftsCheckbox"]')
      .find('input[type="checkbox"]')
      .should("be.enabled");
    cy.get('[data-test="canUpdateStatusOfFormCheckbox"]')
      .find('input[type="checkbox"]')
      .should("be.checked");
    cy.get('[data-test="showAssigneeInSubmissionsTableCheckbox"]')
      .find('input[type="checkbox"]')
      .should("be.checked");
    cy.get('[data-test="canScheduleFormSubmissionCheckbox"]')
      .find('input[type="checkbox"]')
      .should("be.enabled");
    cy.get('[data-test="canCopyExistingSubmissionCheckbox"]')
      .find('input[type="checkbox"]')
      .should("be.checked");
    cy.get('[data-test="canAllowEventSubscriptionCheckbox"]')
      .find('input[type="checkbox"]')
      .should("be.enabled");
    cy.get('[data-test="canSubmitterRevisionFormCheckbox"]')
      .find('input[type="checkbox"]')
      .should("be.enabled");
    cy.get('[data-test="canUploadDraftCheckbox"]')
      .find('input[type="checkbox"]')
      .should("be.enabled");
    cy.get('[data-test="canAllowWideFormLayoutCheckbox"]')
      .find('input[type="checkbox"]')
      .should("be.checked");
    cy.get('[data-test="enableTeamMemberDraftShare"]')
      .find('input[type="checkbox"]')
      .should("be.enabled");
    cy.get('[data-test="canEditForm"]').click();
    cy.waitForLoad();
    //Delete form after test run
    cy.get('[data-test="canRemoveForm"]').click();
    cy.get('[data-test="continue-btn-continue"]').click();
    cy.get("#logoutButton > .v-btn__content > span").click();
  });
});
