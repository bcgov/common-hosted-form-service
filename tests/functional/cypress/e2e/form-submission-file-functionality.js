import "cypress-keycloak-commands";

const depEnv = Cypress.env("depEnv");
const username = Cypress.env("keycloakUsername");
const password = Cypress.env("keycloakPassword");

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
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });
  // Publish a simple form with Simplebc Address component
  it('"Verify export submission', () => {});
});
