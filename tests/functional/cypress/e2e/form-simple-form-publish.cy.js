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
  it("Checks Hidden component", () => {
    cy.viewport(1000, 1100);
    cy.wait(2000);
    cy.get("button").contains("Advanced Data").click();
    cy.wait(2000);
    cy.get("div.formio-builder-form").then(($el) => {
      const coords = $el[0].getBoundingClientRect();
      cy.get("span.btn")
        .contains("Hidden")

        .trigger("mousedown", { which: 1 }, { force: true })
        .trigger("mousemove", coords.x, -400, { force: true })
        .trigger("mouseup", { force: true });
      cy.get('input[name="data[label]"]').clear().type("Application");
      cy.get("button").contains("Save").click();
      cy.wait(2000);
    });
  });
  it("Checks Content", () => {
    cy.viewport(1000, 1800);
    cy.get("button").contains("Advanced Layout").click();
    cy.get("div.formio-builder-form").then(($el) => {
      const coords = $el[0].getBoundingClientRect();
      cy.get("span.btn")
        .contains("Content")

        .trigger("mousedown", { which: 1 }, { force: true })
        .trigger("mousemove", coords.x, -300, { force: true })
        //.trigger('mousemove', coords.y, -50, { force: true })
        .trigger("mouseup", { force: true });
      cy.waitForLoad();
      cy.get("button").contains("Save").click();
    });
  });
  it("Checks the well", () => {
    cy.viewport(1000, 1800);
    cy.waitForLoad();
    // using Advance Layout components
    cy.get("button").contains("Advanced Layout").click();

    cy.waitForLoad();
    cy.get("div.formio-builder-form").then(($el) => {
      const coords = $el[0].getBoundingClientRect();
      cy.get("span.btn")
        .contains("Well")

        .trigger("mousedown", { which: 1 }, { force: true })
        .trigger("mousemove", coords.x, -500, { force: true })
        //.trigger('mousemove', coords.y, -50, { force: true })
        .trigger("mouseup", { force: true });
      cy.wait(2000);
      cy.get('input[name="data[label]"]').clear().type("Application");
      cy.get("button").contains("Save").click();
    });
  });
  it("Checks the Button", () => {
    cy.viewport(1000, 1800);
    cy.wait(2000);
    cy.get("button").contains("Advanced Fields").click();
    cy.get("button").contains("Advanced Fields").click();
    cy.waitForLoad();
    cy.get("div.formio-builder-form").then(($el) => {
      const coords = $el[0].getBoundingClientRect();
      cy.waitForLoad();
      cy.get("span.btn")
        .contains("Button")
        .trigger("mousedown", { which: 1 }, { force: true })
        .trigger("mousemove", coords.x, -700, { force: true })
        .trigger("mouseup", { force: true });
      cy.wait(2000);
      cy.get('input[name="data[label]"]').clear().type("Submit");
      cy.get("button").contains("Save").click();
    });
  });
  it("Checks the Survey", () => {
    cy.viewport(1000, 1800);
    cy.wait(2000);
    cy.get("button").contains("Advanced Fields").click();
    cy.get("button").contains("Advanced Fields").click();
    cy.waitForLoad();
    cy.get("div.formio-builder-form").then(($el) => {
      const coords = $el[0].getBoundingClientRect();
      cy.waitForLoad();
      cy.get("span.btn")
        .contains("Survey")
        .trigger("mousedown", { which: 1 }, { force: true })
        .trigger("mousemove", coords.x, -700, { force: true })
        .trigger("mouseup", { force: true });
      cy.wait(2000);
      cy.get(":nth-child(2) > .nav-link").click();
      cy.get('input[name="data[questions][0][label]"]').click();
      cy.get('input[name="data[questions][0][label]"]').type("Male");
      cy.get('button[ref="datagrid-questions-addRow"]').click();
      cy.get('input[name="data[questions][1][label]"]').click();
      cy.get('input[name="data[questions][1][label]"]').type("Female");
      cy.get("button").contains("Save").click();
    });
  });
  it("Checks the Signature", () => {
    cy.viewport(1000, 1800);
    cy.wait(2000);
    cy.get("button").contains("Advanced Fields").click();
    cy.get("button").contains("Advanced Fields").click();
    cy.waitForLoad();
    cy.get("div.formio-builder-form").then(($el) => {
      const coords = $el[0].getBoundingClientRect();
      cy.waitForLoad();
      cy.get("span.btn")
        .contains("Signature")
        .trigger("mousedown", { which: 1 }, { force: true })
        .trigger("mousemove", coords.x, -700, { force: true })
        .trigger("mouseup", { force: true });
      cy.wait(2000);
      cy.get("button").contains("Save").click();
    });
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
      let dval = arr[2].split("&");
      cy.log(dval);
      // Form preview
      cy.visit(`/${depEnv}/form/preview?f=${arrayValues[0]}&d=${dval[0]}`);
      cy.wait(2000);
      //Verify added components presence in the form
      cy.get(".v-skeleton-loader > .v-container").should("be.visible");
      cy.get(".card").should("be.visible");
      cy.get('button[name="data[simplebuttonadvanced1]"]').should("be.visible");
      cy.get("label").contains("Survey").should("be.visible");
      cy.get(".signature-pad-canvas").should("be.visible");
      cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
      cy.wait(2000);
    });
  });
  it("Validate Ministry list", () => {
    cy.viewport(1000, 1100);
    cy.wait(2000);
    //Edit the form settings
    cy.get(
      ":nth-child(1) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay"
    ).click();
    cy.get('[lang="en"] > .v-btn > .v-btn__content > .mdi-pencil').click();
    cy.wait(2000);
    // Verfiy Ministry/Organization List
    cy.get(
      ".v-row > :nth-child(1) > .v-input > .v-input__control > .v-field > .v-field__append-inner"
    ).click();
    cy.contains("Citizens' Services (CITZ)").should("exist");
    cy.contains("Agriculture and Food (AF)").should("exist");
    cy.contains("Attorney General (AG)").should("exist");
    cy.contains("Crown Agencies and Board Resourcing Office (CABRO)").should(
      "exist"
    );
    cy.contains("Compliance & Enforcement Collaborative (CEC)").should("exist");
    cy.contains(
      "Corporate Information and Records Management Office (CIRMO)"
    ).should("exist");
    cy.contains("Elections BC(EBC)").should("exist");
    cy.contains("Education and Child Care (ECC)").should("exist");
    cy.contains("Emergency Management and Climate Readiness (EMCR)").should(
      "exist"
    );
    cy.contains("Environment and Parks (ENV)").should("exist");
    cy.contains("Finance (FIN)").should("exist");
    cy.contains("Forests (FOR)").should("exist");
    cy.contains(
      "Government Communications and Public Engagement (GCPE)"
    ).should("exist");
    cy.contains("Housing and Municipal Affairs (HMA)").should("exist");
    cy.contains("Health (HLTH)").should("exist");
    cy.contains("Intergovernmental Relations Secretariat (IGRS)").should(
      "exist"
    );
    cy.contains("Ministry of Infrastructure (INFR)").should("exist");
    cy.contains("Indigenous Relations & Reconciliation (IRR)").should("exist");
    cy.contains("Jobs, Economic Development and Innovation (JEDI)").should(
      "exist"
    );
    cy.contains("Labour (LBR)").should("exist");
    cy.contains("Children and Family Development (MCF)").should("exist");
    cy.contains("Mining and Critical Materials (MCM)").should("exist");
    cy.contains("Office of the Comptroller General (OCG)").should("exist");
    cy.contains("Office of the Chief Information Officer (OCIO)").should(
      "exist"
    );
    cy.contains("Office of the Premier (PREM)").should("exist");
    cy.contains("BC Public Service Agency (PSA)").should("exist");
    cy.contains("Public Sector Employers' Council Secretariat (PSECS)").should(
      "exist"
    );
    cy.contains("Post-Secondary Education and Future Skills (PSFS)").should(
      "exist"
    );
    cy.contains("Public Safety and Solicitor General (PSSG)").should("exist");
    cy.contains("Provincial Treasury (PT)").should("exist");
    cy.contains("Social Development and Poverty Reduction (SDPR)").should(
      "exist"
    );
    cy.contains("Tourism, Arts, Culture and Sport (TACS)").should("exist");
    cy.contains("Treasury Board Staff (TB)").should("exist");
    cy.contains("Transportation and Transit (TRAN)").should("exist");
    cy.contains("Water, Land and Resource Stewardship (WLRS)").should("exist");
    cy.contains("Agriculture and Food (AF)").click();
    //Update form settings
    cy.get('[data-test="canEditForm"]').click();
    //Publish the form
    cy.get(
      '[data-cy="formPublishedSwitch"] > .v-input__control > .v-selection-control > .v-label > span'
    ).click();
    cy.get("span").contains("Publish Version 1");
    cy.contains("Continue").should("be.visible");
    cy.contains("Continue").trigger("click");
    //Delete form after test run
    cy.get(":nth-child(5) > .v-btn > .v-btn__content > .mdi-delete").click();
    cy.get('[data-test="continue-btn-continue"]').click();
  });
  it("Validate admin tab", () => {
    cy.wait(5000);
    cy.get('[data-cy="admin"]').click({ force: true });
    cy.get('[value="developer"] > .v-btn__content').should("exist");
    cy.get('[value="forms"] > .v-btn__content').should("exist");
    cy.get('[value="users"] > .v-btn__content').should("exist");
    cy.get('[value="apis"] > .v-btn__content').should("exist");
    cy.get('[value="infoLinks"] > .v-btn__content').should("exist");
    cy.get('[value="dashboard"] > .v-btn__content').should("exist");
    cy.wait(2000);
    //Logout after test run
    cy.get("#logoutButton > .v-btn__content > span")
      .should("be.visible")
      .click();
  });
});
