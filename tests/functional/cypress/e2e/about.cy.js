const depEnv = Cypress.env('depEnv');
const baseUrl = Cypress.env('baseUrl');

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
      cy.wait(500); // Wait for 5 seconds to allow the page to load completely
    }
    cy.checkA11yPage();
  });
});