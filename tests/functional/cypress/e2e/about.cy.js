
const depEnv = Cypress.env('depEnv');
const baseUrl = Cypress.env('baseUrl');


describe('Application About Page', () => {
  it('Visits the app about page', () => {
    
    if(depEnv=="app")
    {
        
        cy.visit(`/app`);
        cy.contains('Create, publish forms, and receive submissions with the Common Hosted Forms Service.').should('be.visible');
    }
    else
    {
      
      
      cy.log("below is url");
      cy.log(`https://chefs-dev.apps.silver.devops.gov.bc.ca/pr-${depEnv}`);
      cy.visit(`https://chefs-dev.apps.silver.devops.gov.bc.ca/pr-${depEnv}`);
      cy.contains('Create, publish forms, and receive submissions with the Common Hosted Forms Service.').should('be.visible');
      
    }
    
  });
});
