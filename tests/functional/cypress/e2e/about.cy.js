
const depEnv = Cypress.env('depEnv');
const baseUrl = Cypress.env('baseUrl');
cy.task('log','this some');

describe('Application About Page', () => {
  it('Visits the app about page', () => {
    
    if(depEnv=="")
    {
        
        cy.visit(`/app`);
        cy.contains('Create, publish forms, and receive submissions with the Common Hosted Forms Service.').should('be.visible');
    }
    else
    {
      
      
      
      cy.visit(`/${depEnv}`);
      cy.contains('Create, publish forms, and receive submissions with the Common Hosted Forms Service.').should('be.visible');
      
    }
    
  });
});
