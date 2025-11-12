const depEnv = Cypress.env('depEnv');
const username=Cypress.env('keycloakUsername');
const password=Cypress.env('keycloakPassword');
import "cypress-real-events";

Cypress.Commands.add('waitForLoad', () => {
  const loaderTimeout = 60000;
  cy.get('.nprogress-busy', { timeout: loaderTimeout }).should('not.exist');
});

describe('Form Designer', () => {
    beforeEach(()=>{
    cy.on('uncaught:exception', (err, runnable) => {
      // Form.io throws an uncaught exception for missing projectid
      // Cypress catches it as undefined: undeefined so we can't get the text
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
    //Share link verification
    cy.get('[data-cy=shareFormButton]').click();
    cy.get('p').contains('Copy the link below or download the QR code.').should('be.visible');
    cy.get('[data-cy="shareFormLinkButton"]')
    .should('have.attr', "href",`https://chefs-dev.apps.silver.devops.gov.bc.ca/${depEnv}/form/submit?f=${formId}`).should('exist');
    //Check link to open in new tab
    cy.get('.v-btn__content > .mdi-open-in-new').should('exist');
      //Check QR code generation
    cy.get('.v-col-1 > .v-btn > .v-btn__content > .mdi-download').should('exist');
    cy.get('.v-col-1 > .v-btn > .v-btn__content > .mdi-download').click();
    cy.wait(1000);
    const downloadsFolder=Cypress.config("downloadsFolder");
    const filePath = `${downloadsFolder}/qrcode.png`;
    cy.task('fileExists', filePath).then((exists) => {
      expect(exists).to.be.true; // Fails if the file doesn’t exist
    });
    //Check copy to clipboard
    cy.get('.mdi-content-copy').should('exist').click();
    //Close form sharing modal window
    cy.get('.v-card-actions > .v-btn').click();
    cy.wait(1000);
    })

    });  
    it('Checks Team mangement functionality', () => {
    cy.viewport(1000, 1800);
    cy.waitForLoad();
    //Enable  auto save feature
    cy.get(':nth-child(1) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay').click();
    cy.get('[lang="en"] > .v-btn > .v-btn__content > .mdi-pencil').click();
    //Option to select Specific team members
    //cy.get('[data-test="userType"] > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    //cy.contains('Specific Team Members').click();
    //cy.get('[data-test="enableAutoSaveCheckbox"]').click();
    cy.get('[data-test="canEditForm"]').click();
    //Go to Team Management
    cy.get('[data-test="canManageTeammembers"]').click();
    cy.get(".mdi-account-plus").click();
    //Search for a member to add
    cy.get(
      ".v-col > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input"
    ).click();
    cy.get('.v-col > .v-btn--variant-outlined > .v-btn__content > span').click();
    cy.wait(3000);
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
    //Email management functionality
    cy.get(".mdi-cog").click();
    cy.wait(2000);
    cy.get(".mdi-email").click();
    cy.wait(2000);
    //Check default email content
    cy.contains('label.v-label', 'Subject').parents('.v-field').find('input').type("{selectall}{backspace}");
    cy.contains('label.v-label', 'Subject').parents('.v-field').find('input').type("Please enter a Subject line for the email");
    cy.contains('label.v-label', 'Title').parents('.v-field').find('input').type("{selectall}{backspace}");
    cy.contains('label.v-label', 'Title').parents('.v-field').find('input').type("Please enter a Title for the email");
    cy.get("textarea").then(($el) => {
        const body = $el[0];
        cy.get(body).type("{selectall}{backspace}");
        cy.get("div")
          .contains("Please enter a Body for the email")
          .should("be.visible");
        cy.get(body).type("Thank you for submission, Click on this link");
    });
    cy.get(".v-form > .v-btn").should("be.enabled");
    cy.get(".v-form > .v-btn").click();
    //cy.on('window:confirm', (text) => {
   // expect(text).to.include('Do you want to save changes?');
    //return true; // click "OK"
    //cy.readFile('cypress/fixtures/formId.json').then(({ formId }) => {
    //cy.visit(`/${depEnv}/form/submit?f=${formId}`);
    //cy.contains('Text Field').click();
    //cy.contains('Text Field').type('Alex');
    //cy.get('.ml-auto > :nth-child(1) > .v-btn').click();
    //cy.get('input[name="data[simpletextfield]"]').should('have.value', 'Alex');
    //});
    
    });

    it('Checks Auto Save Functionality', () => {
    cy.viewport(1000, 1800);
    cy.waitForLoad();
    cy.readFile('cypress/fixtures/formId.json').then(({ formId }) => {
    const url = `/${depEnv}/form/submit?f=${formId}`;
    let formCacheKey;

    // First visit to determine the cache key
    cy.visit(url);
    cy.contains('Text Field').click();
    cy.contains('Text Field').type('Alex');
    cy.get('button').contains('Submit').should('be.visible');
    cy.wait(2000);

    cy.window().then((win) => {
      formCacheKey = Object.keys(win.localStorage).find(k =>
        k.startsWith('chefs_autosave_')
      );
      //expect(formCacheKey, 'autosave key found').to.exist;

      // Set your autosave data
      win.localStorage.setItem(
        formCacheKey,
        JSON.stringify({ data: { simpletextfield: 'Alex' } })
      );
    });

    // Reload with the preloaded data
    cy.visit(url, {
      onBeforeLoad(win) {
        formCacheKey = Object.keys(win.localStorage).find(k =>
        k.startsWith('chefs_autosave_')
      );
        // restore the previously set autosave data
        win.localStorage.setItem(
          formCacheKey,
          JSON.stringify({ data: { simpletextfield: 'Alex' } })
        );
      },
    });

    // Now the app should show "Restore Data"
    cy.contains('Restore Data', { timeout: 5000 }).should('be.visible').click();
  });
});

    
    //Delete form after test run
    //cy.get('.mdi-cog').click();
    //cy.get(".mdi-delete").click();
    //cy.get('[data-test="continue-btn-continue"]').click();
  
});
