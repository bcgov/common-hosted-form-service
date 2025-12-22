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
    }); 
// Update manage form settings
    it('Login and call the existing form', () => {
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
    })

    });  
    it('Checks Team mangement functionality', () => {
    cy.viewport(1000, 1800);
    cy.waitForLoad();
    //Go to Team Management
    cy.get('[data-test="canManageTeammembers"]').click();
    cy.get(".mdi-account-plus").click();
    //Search for a member to add
    cy.get(
      ".v-col > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input"
    ).click();
    cy.get('.v-col > .v-btn--variant-outlined > .v-btn__content > span').click();
    cy.wait(1000);
    //Manage column views
    cy.get(".mdi-view-column").click();
    cy.get("table").contains("td", "Reviewer").should("be.visible");
    cy.get("table").contains("td", "Approver").should("be.visible");
    cy.get(
      '[data-test="filter-table"] > .v-table__wrapper > table > tbody > :nth-child(1) > :nth-child(2)'
    ).click();
    cy.waitForLoad();
    //Column view management
    cy.get(".search").click();
    cy.get(".search").type("Designer");
    cy.get("table").contains("td", "Designer").should("be.visible");
    cy.get('[data-test="save-btn"] > .v-btn__content').click();
    cy.waitForLoad();
    cy.get('[data-test="OwnerRoleCheckbox"]').click();
    cy.wait(1000);
    cy.get(".v-alert__content")
      .contains("Can't remove the only owner.")
      .should("be.visible");
      cy.get(".v-alert__close").click();
    //Email management functionality
    cy.get(".mdi-cog").click();
    cy.wait(2000);
    cy.get(".mdi-email").click();
    cy.wait(2000);
    cy.get('input[type="text"]').then(($el) => {
      const sub = $el[1];
      const titl = $el[2];
      //cy.get(sub).click({force: true});
      cy.get(sub).should("have.value", "{{ form.name }} Accepted");
      cy.get(titl).should("have.value", "{{ form.name }} Accepted");
      cy.get(sub).type("{selectall}{backspace}");
      cy.get("div")
        .contains("Please enter a Subject line for the email")
        .should("be.visible");
      cy.get(titl).type("{selectall}{backspace}");
      cy.get("div")
        .contains("Please enter a Title for the email")
        .should("be.visible");
      cy.get("textarea").then(($el) => {
        const body = $el[0];
        cy.get(body).type("{selectall}{backspace}");
        cy.get("div")
          .contains("Please enter a Body for the email")
          .should("be.visible");
        cy.get(body).type("Thank you for submission, Click on this link");
      });
      cy.get(sub).type("CHEFS submission Subject");
      cy.get(titl).type("CHEFS submission Title");
      cy.get(".v-form > .v-btn").should("be.enabled");
      cy.get(".v-form > .v-btn").click();
    });
  });
  it('Checks Advanced Search functionality', () => {
    cy.viewport(1000, 1800);
    cy.waitForLoad();
    cy.readFile('cypress/fixtures/formId.json').then(({ formId }) => {
    cy.visit(`/${depEnv}/form/manage?f=${formId}`);
    cy.wait(2000);
    cy.get(".mdi-list-box-outline").click();
    //Advance search on Submissions page
    cy.get('.v-btn__prepend > .mdi-magnify').click();
    //cy.contains('label', 'Search term').click({ force: true });
    cy.contains('label', 'Search term')
      .invoke('attr', 'for')
       .then((id) => {
        cy.get(`#${id}`).click().type('Nancy');
      });

    cy.get('.v-card-text > .v-select > .v-input__control > .v-field > .v-field__append-inner > .mdi-menu-down').click();
    cy.wait(1000);
    cy.contains('simpletextfield').click({force: true});
    cy.get('.v-card-text > .v-select > .v-input__control > .v-field > .v-field__append-inner').click();
    cy.get('.v-card-text > .v-btn').click();
    //Verify Submission table has only search results
    cy.get('.v-data-table__tr > :nth-child(7)').contains('Nancy').should('be.visible');
    cy.get('.v-data-table__tbody > :nth-child(1) > :nth-child(7)').contains('Edit uploaded draft').should('not.exist');
    //Clear search results
    cy.get('.v-btn--density-compact > .v-btn__content').click();
    cy.get('.v-data-table__tr > :nth-child(7)').contains('Edit uploaded draft').should('exist');
    cy.get('.v-data-table__tbody > :nth-child(4) > :nth-child(7)').contains('Nancy').should('exist');


    });
    //Delete form after test run
    cy.get('.mdi-cog').click();
    cy.get(".mdi-delete").click();
    cy.get('[data-test="continue-btn-continue"]').click();
  });
});
