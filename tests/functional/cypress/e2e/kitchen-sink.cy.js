const { format } = require('date-fns');

const depEnv = Cypress.env('depEnv');
// TODO: Parameterize formId, submissionId and versionId for full e2e test (no cypress.intercepts variant)
const formId = '897e2ca1-d81c-4079-a135-63b930f98590';
const submissionId = '3d2d6833-6e78-43e3-b332-6e66b6b8879c';
const versionId = 'e7b20c83-416b-479d-9ff8-65fcd72a2bff';

const data = {
  textFieldNested1: "textFieldNested1",
  textFieldNested2: "textFieldNested2",
  textFieldInFieldset1: "textFieldInFieldset1",
  selectListInFieldset1: 2,
  email2: "foo@bar.com",
  textField3: "textField3",
  phoneNumber2: "(123) 456-7890",
  registeredBusinessName1: "TEST COMMUNICATIONS",
  textField1: "textField1",
  multiLineText1: "multiLineText1",
  selectList1: "selection2",
  selectList2: [
    "select2",
    "select3"
  ],
  checkbox1: true,
  checkboxGroup1: {
    "check1": true,
    "check2": false,
    "check3": true
  },
  radioGroup1: "radio2",
  phoneNumber1: "(012) 345-6789",
  email1: "bar@baz.com",
  // Date format should be '2021-07-05T12:00:00-07:00'
  dateTime1: format(new Date(), 'yyyy-MM-dd\'T\'12:00:00xxx'),
  day1: "06/29/2021",
  time1: "11:30:00",
  submit: true,
  number2: 3,
  number: 4
};

//
// Helper Functions
//
function helperTwoColumn() {
  cy.contains('span', 'Layout & Static Content').click();
  //cy.get('[href="#2Column"]').click();
  cy.contains('span', 'Layout & Static Content').click();
  cy.get('[href="#2Column"]').click();

  // textFieldNested1
  
  
  cy.contains('Text Field Nested 1').type(data.textFieldNested1);

  // textFieldNested2
  cy.contains('Text Field Nested 2').type(data.textFieldNested2);
  
}

function helperThreeColumn() {
  cy.get('[href="#3Column"]').click();

  cy.contains('h1', 'Static text');
  cy.contains('p', 'Here is some');
  cy.contains('h1', 'Heading for a Paragraph');
  cy.contains('p', 'Paragraph test with no logic.');

  // textFieldInFieldset1
 
  cy.contains('Text Field in Fieldset 1').type(data.textFieldInFieldset1);

  
  // selectListInFieldset1
 
  cy.contains('Select List in Fieldset 1').click();
  
  
  
  
  cy.get('[data-value="2"]').click();

}

function helperFourColumn() {
  cy.get('[href="#4Column"]').click();

  // email2
 
 cy.contains('Email 2').type(data.email2);

  // number2
 
  cy.contains('Number 2').type(data.number2);

  // textField3
 
 cy.contains('Text Field 2').type(data.textField3);

  // phoneNumber2
 
  cy.contains('Phone Number 2').type(data.phoneNumber2);
}

function helperFormFields() {
  // registeredBusinessName1
  cy.contains('Registered Business Name 1').click();
  cy.get('[aria-label="Start typing to search BC Registered Businesses database"]').type('test');
  //cy.get('#choices--e9kc7ln-registeredBusinessName1-item-choice-2').click();
  cy.contains('TEST COMMUNICATIONS').click();

  // textField1
 
  cy.contains('Text Field 1').type(data.textField1);

  // multiLineText1
  
  cy.contains('Multi-line Text 1').type(data.multiLineText1);

  // selectList1
  
  cy.contains('Select List 1').click();
  //cy.get('#choices--eywliig-selectList1-item-choice-3').click();
  cy.contains('Selection 2').click();

  // selectList2
 
  cy.get('.ui > .choices__input--cloned').click();
  cy.contains('Select 2').click();
  cy.contains('Select 3').click();
  //cy.get('#choices--e1mw1vq-selectList2-item-choice-3').click();

  // checkbox1
  
  cy.contains('Checkbox 1').click();

  // checkboxGroup1
  
  cy.contains('Check 1').click();
  cy.contains('Check 3').click();
 

  // radioGroup1
  
  cy.contains('Radio 2').click();

  // number
 
 cy.contains('Number 1').type(data.number);

  // phoneNumber1
  
  cy.contains('Phone Number 1').type(data.phoneNumber1);

  // email1
  cy.contains('Email 1').type(data.email1);

  // dateTime1
 
  cy.get('.input-group-text > .fa').click();
  cy.get('.flatpickr-day.today').click();

  // day1
  cy.get('#day1-month').select('June');
  cy.get('#day1-day').type('29');
  cy.get('#day1-year').type('2021');

  // time1
 
  
  cy.get('[type="time"]').type('11:30');
  
  
}

//
// Tests
//
describe('Kitchen Sink Example Form', () => {
  beforeEach(() => {
    // Form Load
    cy.intercept('GET', `/${depEnv}/api/v1/forms/${formId}/options`, {
      fixture: 'kitchensink/formOptions.json'
    }).as('formOptions');
    cy.intercept('GET', `/${depEnv}/api/v1/forms/${formId}/version`, {
      fixture: 'kitchensink/formVersion.json'
    }).as('formVersion');

    // Form Submit and Success
    cy.intercept('POST', `/${depEnv}/api/v1/forms/${formId}/versions/${versionId}/submissions`, {
      statusCode: 200,
      body: {
        id: submissionId,
        formVersionId: formId,
        confirmationId: submissionId.substring(0, 8).toUpperCase(),
        draft: false,
        deleted: false,
        submission: {}
      }
    }).as('formSubmit');
    cy.intercept('GET', `/${depEnv}/api/v1/submissions/${submissionId}/options`, {
      fixture: 'kitchensink/submissionOptions.json'
    }).as('submissionOptions');
    cy.intercept('GET', `/${depEnv}/api/v1/submissions/${submissionId}`, {
      fixture: 'kitchensink/submission.json'
    }).as('submission');

    // Visit Page
    cy.visit(`/${depEnv}/form/submit?f=${formId}`);
    cy.wait(['@formOptions', '@formVersion']);
    cy.location('pathname').should('eq', `/${depEnv}/form/submit`);
    cy.location('search').should('eq', `?f=${formId}`);
  });

  it('Visits the kitchen sink form', () => {
    // Title
    cy.contains('h1', 'Kitchen Sink Simple');

    // Collapsible Panels
    cy.contains('span', 'Layout & Static Content').click();
    cy.contains('span', 'Form Fields').click();
  });

  it('Fills out the kitchen sink form', () => {
    // Fill Form
    cy.contains('span', 'Layout & Static Content').click();
    helperTwoColumn();
    helperThreeColumn();
    helperFourColumn();

    cy.contains('span', 'Form Fields').click();
    helperFormFields();

    // Submit
    cy.get('button').contains('Submit').click();
    cy.wait('@formSubmit');
    cy.get('@formSubmit').should((req) => {
      expect(req.request.body.draft).to.be.false;
      // Ensure submission data object deeply matches expectations
      Object.entries(data).forEach(([k, v]) => {
        //debugger ;
        console.log(`k is ${req.request.body.submission.data[k]}`)
        console.log(`v is ${v}`)
       
       expect(req.request.body.submission.data[k]).to.deep.equal(v);
      });
   });

    //// Success
    //
    cy.wait('@submission');
    cy.location('pathname').should('eq', `/${depEnv}/form/success`);
    cy.location('search').should('eq', `?s=${submissionId}`);
    cy.contains('h1', 'Your form has been submitted successfully');
    cy.contains('mark', submissionId.substring(0, 8).toUpperCase());
  });
});
