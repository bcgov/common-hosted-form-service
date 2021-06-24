describe('Application About Page', () => {
  it('Visits the app about page', () => {
    cy.visit('https://chefs-test.apps.silver.devops.gov.bc.ca/app/');
    cy.contains('h1', 'Create and publish forms, and receive submissions from your users');
  });
});
