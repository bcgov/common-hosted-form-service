const depEnv = Cypress.env('depEnv');
const baseUrl = Cypress.env('baseUrl');
const username=Cypress.env('keycloakUsername');
const password=Cypress.env('keycloakPassword');


describe('Application About Page', () => {
  it('Visits the app about page', () => {
    
    if(depEnv=="")
    {
        cy.visit(`/app`);
        cy.contains('Create, publish forms, and receive submissions with the Common Hosted Forms Service.').should('be.visible');
    }
    else
    {
      cy.visit(`${depEnv}`);
      cy.wait(2000); // Adjust the wait time as necessary
      cy.get('[data-test="go-to-chefs-btn"] > .v-btn__content').contains('Go to CHEFS ').should('be.visible');
      //cy.get('[data-test="go-to-chefs-btn"]').should('have.attr', 'href').and('match', /^\/pr-\d+\/form\/create$/);
      cy.get(':nth-child(2) > .enterprise-card-content > .v-btn > .v-btn__content').contains('Go To CSTAR ').should('be.visible');
      cy.get('.alert-content-wrapper > .v-btn > .v-btn__content').contains('Log in to CSTAR').should('be.visible');
      cy.get('.v-col-md-8 > .v-btn > .v-btn__content').contains('Login to Get Started').should('be.visible');
      //Login to application
      cy.get('#logoutButton > .v-btn__content > span').should('not.exist');
      cy.get('#loginButton').click();
      cy.get('[data-test="idir"]').click();
      cy.get('#user').type(username);
      cy.get('#password').type(password);
      cy.origin('https://logontest7.gov.bc.ca', () => {
      cy.get('.btn')
      .should('be.visible')
      .and('not.be.disabled')
      .click({ force: true });
      })
      cy.wait(1000); // Adjust the wait time as necessary
      cy.get('[data-test="go-to-chefs-btn"] > .v-btn__content').contains('Go to CHEFS ').should('be.visible');
      //cy.get('[data-test="go-to-chefs-btn"]').should('have.attr', 'href').and('match', /^\/pr-\d+\/form\/create$/);
      cy.get(':nth-child(2) > .enterprise-card-content > .v-btn > .v-btn__content').contains('Go To CSTAR ').should('be.visible');
      cy.get('.alert-content-wrapper > .v-btn > .v-btn__content').contains('Log in to CSTAR').should('be.visible');
      cy.get('.v-col-md-8 > .v-btn > .v-btn__content').contains('Create a Form').should('be.visible');
      cy.get('.doc-link').should("have.attr", "href", "https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/");
      cy.get('.getting-started-description').should('be.visible');
      //Check example forms count
      cy.get('.mt-8 > *:visible').should('have.length', 12);
      cy.get('.info-icon')
      .should(
      'have.attr',
      'aria-label',
      'Enterprise CHEFS is the new version of CHEFS that supports multi-tenant access. Selecting your tenant will take you there automatically.'
      )
      //Default tenant selection should be Personal CHEFS
      cy.get('.selected-tenant').contains('Personal CHEFS').should('be.visible');
      //Select tenant and validate CSTAR access
      cy.get('.mdi-home-account').click();
      cy.get('.v-list-item__content').contains('Go to CSTAR (Connected Services, Team Access and Roles)').should('exist');
      cy.get('.v-list-item__content').contains('Test_eCHEFS').should('be.visible');
      cy.get('.v-list-item__content').contains('Test_eCHEFS').click({ waitForAnimations: false });
      cy.get('[data-cy="createNewForm"]').should('be.visible');
      cy.get('[data-cy="createNewForm"]').contains('Create a New Form').should('be.visible');
      
    }
    
    cy.checkA11yPage();
  });
});