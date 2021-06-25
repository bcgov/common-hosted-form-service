describe('Application About Page', () => {
  it('Visits the app about page', () => {
    cy.visit('/');
    cy.contains('h1', 'Create and publish forms, and receive submissions from your users');
  });
});
