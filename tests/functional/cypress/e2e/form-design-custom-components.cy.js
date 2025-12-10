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
  it("Add IDIR User Component", () => {
    cy.viewport(1000, 1100);
    cy.wait(1000);
    cy.get('button').contains('BC Government').click();
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
  });
  it('Verify IDIR User Component', () => {
    let savedButton = cy.get('[data-cy=saveButton]');
    expect(savedButton).to.not.be.null;
    savedButton.trigger('click');
    cy.wait(1000);
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
    });

});

});