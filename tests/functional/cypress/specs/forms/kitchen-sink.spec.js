describe('Kitchen Sink Example Form', () => {
  it('Visits the kitchen sink form', () => {
    cy.visit('/form/submit?f=897e2ca1-d81c-4079-a135-63b930f98590');
    cy.contains('h1', 'Kitchen Sink Simple');
  });

  it('Has two expandable panels', () => {
    cy.visit('/form/submit?f=897e2ca1-d81c-4079-a135-63b930f98590');
    cy.contains('span', 'Layout & Static Content').click();
    cy.contains('span', 'Form Fields').click();
  });

  it('Has two nested panel text fields', () => {
    cy.visit('/form/submit?f=897e2ca1-d81c-4079-a135-63b930f98590');
    cy.contains('span', 'Layout & Static Content').click();

    const textFieldNested1 = cy.get('[id="eflswzo"]');
    textFieldNested1.contains('label', 'Text Field Nested 1');
    textFieldNested1.type('textFieldNested1');

    const textFieldNested2 = cy.get('[id="epo28b6"]');
    textFieldNested2.contains('label', 'Text Field Nested 2');
    textFieldNested2.type('textFieldNested2');
  });
});
