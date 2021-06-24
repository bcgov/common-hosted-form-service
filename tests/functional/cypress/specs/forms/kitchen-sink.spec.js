describe('Kitchen Sink Example Form', () => {
  it('Visits the kitchen sink form', () => {
    cy.visit('https://chefs-test.apps.silver.devops.gov.bc.ca/app/form/submit?f=897e2ca1-d81c-4079-a135-63b930f98590');
    cy.contains('button', 'Submit');
  });
});
