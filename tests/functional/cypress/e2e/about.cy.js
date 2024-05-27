
const depEnv = Cypress.env('depEnv');
const baseUrl = Cypress.env('baseUrl');


describe('Application About Page', () => {
  it('Visits the app about page', () => {
    
    if(depEnv=="")
    {
        cy.visit(`/app`);
    }
    else
    {

      cy.visit(`/pr-${depEnv}`);
      cy.contains('h1', 'Create, publish forms, and receive submissions with the Common Hosted Forms Service.');
    }
    
  });
});
