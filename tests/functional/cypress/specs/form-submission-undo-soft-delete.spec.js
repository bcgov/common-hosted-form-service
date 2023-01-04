import 'cypress-keycloak-commands';

const depEnv = Cypress.env('depEnv');

Cypress.Commands.add('waitForLoad', () => {
  const loaderTimeout = 60000;

  cy.get('.nprogress-busy', { timeout: loaderTimeout }).should('not.exist');
});

Cypress.Commands.add('createForm', () => {
  cy.intercept({
    method: 'GET',
    url: `/${depEnv}/api/v1/forms/*`
  }).as('getForm');
  cy.intercept({
    method: 'POST',
    url: `/${depEnv}/api/v1/forms`
  }).as('createForm');
  cy.visit(`/${depEnv}/form/create`);
  cy.location('pathname').should('eq', `/${depEnv}/form/create`);
  cy.on('uncaught:exception', (err, runnable) => {
    // Form.io throws an uncaught exception for missing projectid
    // Cypress catches it as undefined: undefined so we can't get the text
    console.log(err);
    return false;
  });
  cy.get(`input[data-test='text-name']`).type('Test', { delay: 0 });
  cy.get('div').contains('Disclaimer').parent().find(`input[type='checkbox']`).parent().click();
  cy.get('button').contains('Continue').click();
  cy.get('h1').contains('Form Design');
  cy.get('i').contains('save').parent().parent().click();
  cy.wait(['@createForm', '@getForm']);
});

beforeEach(() => {
  cy.viewport(1000, 1800);
  cy.waitForLoad();
  cy.kcLogout();
  cy.kcLogin("user");
});

describe('Shows deleted form submissions', () => {
  it('Publishes the form, submits a form, deletes the submission', () => {
    const formId = '11111111-1111-1111-1111-111111111111';
    const formVersionId = '1111111111-1111-1111-111111111112';
    cy.intercept({
      method: 'GET',
      url: `/${depEnv}/api/v1/rbac/current`
    },{
      fixture: 'forms/current-forms.json'
    }).as('getCurrentForms');
    cy.intercept({
      method: 'GET',
      url: `/${depEnv}/api/v1/rbac/current?formId=${formId}`
    },{
      fixture: 'forms/current-forms.json'
    }).as('getCurrentForm');
    cy.intercept({
      method: 'GET',
      url: `/${depEnv}/api/v1/forms/${formId}`
    },{
      fixture: 'forms/form.json'
    }).as('getForm');
    cy.intercept({
      method: 'GET',
      url: `/${depEnv}/api/v1/forms/${formId}/versions/${formVersionId}/fields`
    }, {
      fixture: 'forms/form-field.json'
    }).as('getField');
    cy.intercept({
      method: 'GET',
      url: `/${depEnv}/api/v1/users/preferences/forms/${formId}`
    }, {}).as('getPreferences');
    cy.intercept({
      method: 'GET',
      url: `/${depEnv}/api/v1/forms/${formId}/submissions?deleted=false`
    }, []).as('getSubmissions');
    cy.visit(`/${depEnv}/form/submissions?f=${formId}`);
    cy.waitForLoad();
    cy.wait(['@getCurrentForms', '@getCurrentForm', '@getForm', '@getField', '@getPreferences', '@getSubmissions']);
    cy.intercept({
      method: 'GET',
      url: `/${depEnv}/api/v1/forms/${formId}/submissions?deleted=true`
    }, {
      fixture: 'forms/form-submission.json'
    }).as('getSubmissions');
    cy.get('label').contains('Show deleted submissions').parent().parent().parent().click();
  });
});


describe('Restores deleted form submission', () => {
  it('Publishes the form, submits a form, deletes the submission', () => {
    const formId = '11111111-1111-1111-1111-111111111111';
    const formVersionId = '1111111111-1111-1111-111111111112';
    const submissionId = '1111111111-1111-1111-111111111113';
    cy.intercept({
      method: 'GET',
      url: `/${depEnv}/api/v1/rbac/current`
    },{
      fixture: 'forms/current-forms.json'
    }).as('getCurrentForms');
    cy.intercept({
      method: 'GET',
      url: `/${depEnv}/api/v1/rbac/current?formId=${formId}`
    },{
      fixture: 'forms/current-forms.json'
    }).as('getCurrentForm');
    cy.intercept({
      method: 'GET',
      url: `/${depEnv}/api/v1/forms/${formId}`
    },{
      fixture: 'forms/form.json'
    }).as('getForm');
    cy.intercept({
      method: 'GET',
      url: `/${depEnv}/api/v1/forms/${formId}/versions/${formVersionId}/fields`
    }, {
      fixture: 'forms/form-field.json'
    }).as('getField');
    cy.intercept({
      method: 'GET',
      url: `/${depEnv}/api/v1/users/preferences/forms/${formId}`
    }, {}).as('getPreferences');
    cy.intercept({
      method: 'GET',
      url: `/${depEnv}/api/v1/forms/${formId}/submissions?deleted=false`
    }, []).as('getSubmissions');
    cy.visit(`/${depEnv}/form/submissions?f=${formId}`);
    cy.waitForLoad();
    cy.wait(['@getCurrentForms', '@getCurrentForm', '@getForm', '@getField', '@getPreferences', '@getSubmissions']);
    cy.intercept({
      method: 'GET',
      url: `/${depEnv}/api/v1/forms/${formId}/submissions?deleted=true`
    }, {
      fixture: 'forms/form-submission-deleted.json'
    }).as('getSubmissions');
    cy.get('label').contains('Show deleted submissions').parent().parent().parent().click();
    cy.wait('@getSubmissions');
    cy.intercept({
      method: 'GET',
      url: `/${depEnv}/api/v1/forms/${formId}/submissions?deleted=true`
    }, {
      fixture: 'forms/empty-array.json'
    }).as('getSubmissions');
    cy.intercept({
      method: 'PUT',
      url: `/${depEnv}/api/v1/submissions/${submissionId}/restore`
    }, {
      fixture: 'forms/submission-restore.json'
    }).as('restore');
    cy.get('i').contains('restore_from_trash').parent().parent().click();
    cy.get('span').contains('Restore').parent().parent().click();
    cy.wait('@restore');

    cy.intercept({
      method: 'GET',
      url: `/${depEnv}/api/v1/forms/${formId}/submissions?deleted=false`
    }, {
      fixture: 'forms/form-submission.json'
    }).as('getSubmissions');
    cy.get('label').contains('Show deleted submissions').parent().parent().parent().click();

  });
});
