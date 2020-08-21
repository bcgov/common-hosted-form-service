describe('Application', () => {
  it('Visits the app root url', () => {
    cy.visit('/');
    cy.contains('div', 'Common Hosted Forms');
  });
});
