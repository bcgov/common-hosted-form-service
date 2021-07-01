// TODO: Parameterize formId variable
const depEnv = 'app';
const formId = '897e2ca1-d81c-4079-a135-63b930f98590';

describe('Kitchen Sink Example Form', () => {
  beforeEach(() => {
    cy.intercept('GET', `/${depEnv}/api/v1/forms/${formId}`, {
      fixture: 'kitchen-sink.json'
    }).as('formMeta');
    cy.intercept('GET', `/${depEnv}/api/v1/forms/${formId}/version`, {
      fixture: 'kitchen-sink-version.json'
    }).as('formVersion');

    cy.visit(`/${depEnv}/form/submit?f=${formId}`);
    cy.wait(['@formMeta', '@formVersion']);
  });

  it('Visits the kitchen sink form', () => {
    // Title
    cy.contains('h1', 'Kitchen Sink Simple');

    // Collapsible Panels
    cy.contains('span', 'Layout & Static Content').click();
    cy.contains('span', 'Form Fields').click();
  });

  describe('Layout & Static Content', () => {
    beforeEach(() => {
      cy.contains('span', 'Layout & Static Content').click();
    });

    it('2 column has two nested panel text fields', () => {
      cy.get('[href="#2Column"]').click();

      // textFieldNested1
      cy.get('#eflswzo').contains('label', 'Text Field Nested 1').type('textFieldNested1');

      // textFieldNested2
      cy.get('#epo28b6').contains('label', 'Text Field Nested 2').type('textFieldNested2');
    });

    it('3 column has two nested input fields', () => {
      cy.get('[href="#3Column"]').click();

      cy.contains('h1', 'Static text');
      cy.contains('p', 'Here is some');
      cy.contains('h1', 'Heading for a Paragraph');
      cy.contains('p', 'Paragraph test with no logic.');

      // textFieldInFieldset1
      cy.get('#e7t221q').contains('label', 'Text Field in Fieldset 1').type('textFieldInFieldset1');

      // selectListInFieldset1
      cy.get('#e67463a').contains('label', 'Select List in Fieldset 1').click();
      cy.get('#choices--e67463a-selectListInFieldset1-item-choice-2').click();
    });

    it('4 column has four nested input fields', () => {
      cy.get('[href="#4Column"]').click();

      // email2
      cy.get('#eejkjy9').contains('label', 'Email 2').type('foo@bar.com');

      // number2
      cy.get('#eto8jk').contains('label', 'Number 2').type('3');

      // textField3
      cy.get('#e4zi6q').contains('label', 'Text Field 2').type('textField3');

      // phoneNumber2
      cy.get('#erq1vo').contains('label', 'Phone Number 2').type('1234567890');
    });
  });

  describe('Form Fields', () => {
    beforeEach(() => {
      cy.contains('span', 'Form Fields').click();
    });

    it('Has functional form fields', () => {
      // registeredBusinessName1
      cy.get('#e9kc7ln').contains('label', 'Registered Business Name 1').click();
      cy.get('[aria-label="Start typing to search BC Registered Businesses database"]').type('test');
      cy.get('#choices--e9kc7ln-registeredBusinessName1-item-choice-2').click();

      // textField1
      cy.get('#epe4uo').contains('label', 'Text Field 1').type('textField1');

      // multiLineText1
      cy.get('#eozuc1').contains('label', 'Multi-line Text 1').type('multiLineText1');

      // selectList1
      cy.get('#eywliig').contains('label', 'Select List 1').click();
      cy.get('#choices--eywliig-selectList1-item-choice-3').click();

      // selectList2
      cy.get('#e1mw1vq').contains('label', 'Select List 1').click();
      cy.get('#choices--e1mw1vq-selectList2-item-choice-2').click();
      cy.get('#choices--e1mw1vq-selectList2-item-choice-3').click();

      // checkbox1
      cy.get('#e6ceb5').contains('label', 'Checkbox 1').click();

      // checkboxGroup1
      cy.get('#eoqkh1').contains('label', 'Checkbox Group 1');
      cy.get('#eoqkh1-check1').click();
      cy.get('#eoqkh1-check3').click();

      // radioGroup1
      cy.get('#ev6fyvb').contains('label', 'Radio Group 1');
      cy.get('[for="ev6fyvb-radio2"]').click();

      // number
      cy.get('#ebedo1d').contains('label', 'Number 1').type('4');

      // phoneNumber1
      cy.get('#ep7r3ch').contains('label', 'Phone Number 1').type('0123456789');

      // email1
      cy.get('#ebejr93').contains('label', 'Email 1').type('bar@baz.com');

      // dateTime1
      cy.get('#eb683f').contains('label', 'Date / Time 1');
      cy.get('#eb683f .form-control.input').click();
      cy.get('.flatpickr-day.today').click();

      // day1
      cy.get('#e619db6').contains('label', 'Day 1');
      cy.get('#day1-month').select('June');
      cy.get('#day1-day').type('29');
      cy.get('#day1-year').type('2021');

      // time1
      cy.get('#eupvl3').contains('label', 'Time 1').type('11:30');
    });
  });
});
