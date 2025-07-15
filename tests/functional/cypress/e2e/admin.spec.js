import 'cypress-keycloak-commands';

import { IdentityProviders } from '../../../../app/frontend/src/utils/constants';

const depEnv = Cypress.env('depEnv');

const formModuleData = require('../fixtures/formModules/formModule.json');
const updatedFormModuleData = require('../fixtures/formModules/updatedFormModule.json');
const disabledFormModuleData = require('../fixtures/formModules/disabledFormModule.json');
const formModuleVersionData = require('../fixtures/formModules/formModuleVersion.json');
const updatedFormModuleVersionData = require('../fixtures/formModules/updatedFormModuleVersion.json');
const secondFormModuleVersionData = require('../fixtures/formModules/secondFormModuleVersion.json');

Cypress.Commands.add('waitForLoad', () => {
  const loaderTimeout = 60000;

  cy.get('.nprogress-busy', { timeout: loaderTimeout }).should('not.exist');
});

beforeEach(() => {
  cy.waitForLoad();
  cy.kcLogout();
  cy.kcLogin("user");
});

describe('Admin Vue', () => {
  beforeEach(() => {
    cy.intercept('GET', `/${depEnv}/api/v1/form_modules/${formModuleData.id}`, {
      fixture: 'formModules/formModule',
      times: 1
    }).as('formModule');
  });

  it('Visits the form module page', () => {
    cy.intercept('GET', `/${depEnv}/api/v1/form_modules?active=true`, {
      fixture: 'formModules/activeFormModules.json'
    }).as('formModules');

    cy.visit(`/${depEnv}/admin`);
    cy.contains('Admin');
    cy.location('pathname').should('eq', `/${depEnv}/admin`);
    cy.contains('Form Modules');
    cy.get('div.v-tab').contains('Form Modules').click();
    cy.wait(['@formModules']);
    cy.contains('Default Components');
  });

  it('Imports a form module', () => {
    cy.intercept('POST', `/${depEnv}/api/v1/form_modules`, {
      statusCode: 200,
      body: formModuleData,
    }).as('importFormModule');
    cy.intercept('GET', `/${depEnv}/api/v1/form_modules/${formModuleData.id}/version`, {
      fixture: 'formModules/formModuleVersions',
      times: 1,
    }).as('formModuleVersions');
    cy.intercept('POST', `/${depEnv}/api/v1/form_modules/${formModuleData.id}/version`, {
      statusCode: 200,
      body: formModuleVersionData
    }).as('importFormModuleVersion');

    cy.visit(`/${depEnv}/form_module/import`);
    cy.contains('Import Form Module');
    cy.contains('Form Designer IDP Access');
    cy.contains('Import Data (JSON)');
    cy.contains('External URIs');
    cy.location('pathname').should('eq', `/${depEnv}/form_module/import`);
    cy.get('input[name="pluginName"]').type(formModuleData.pluginName);
    Object.values(IdentityProviders).forEach((constant_idp) => {
      formModuleData.identityProviders.map((idp) => {
        if (idp.code === constant_idp) {
          cy.get(`input[value='${idp.code}']`).parent().click();
        }
      });
    });
    cy.get('textarea[name="importData"]').type(JSON.stringify(formModuleVersionData.importData),{parseSpecialCharSequences: false, delay: 0});
    for (let i = 1; i < formModuleVersionData.externalUris.length; i++) {
      cy.get('button').contains('add').click();
    }
    let uris = cy.get('div').contains('External URIs').next().find('input');
    uris.each(($el, index) => {
      cy.wrap($el).type(formModuleVersionData.externalUris[index], {parseSpecialCharSequences: false, delay: 0});
    });
    cy.get('button').contains('Submit').click();
    cy.wait(['@importFormModule', '@importFormModuleVersion', '@formModuleVersions']);
  });

  it('Updates a form module', () => {
    cy.intercept('GET', `/${depEnv}/api/v1/form_modules/${formModuleData.id}/version`, {
      fixture: 'formModules/formModuleVersions',
    }).as('formModuleVersions');
    cy.intercept('PUT', `/${depEnv}/api/v1/form_modules/${formModuleData.id}`, {
      statusCode: 200,
      body: updatedFormModuleData
    });
    cy.visit(`/${depEnv}/form_module/manage?fm=${formModuleData.id}`);
    cy.wait(['@formModule']);

    cy.get('input[name="pluginName"]').clear().type('asdfasdf', { delay: 0 });
    cy.get(`input[value='idir']`).parent().click();
    cy.intercept('GET', `/${depEnv}/api/v1/form_modules/${formModuleData.id}`, {
      fixture: 'formModules/updatedFormModule',
      times: 1
    }).as('formModule');
    cy.get('button').contains('Update').click();
  });

  it('Toggles a form module', () => {
    cy.intercept('GET', `/${depEnv}/api/v1/form_modules/${formModuleData.id}/version`, {
      fixture: 'formModules/formModuleVersions',
    }).as('formModuleVersions');
    cy.intercept('POST', `/${depEnv}/api/v1/form_modules/${formModuleData.id}/toggle?active=false`, {
      statusCode: 200,
      body: disabledFormModuleData
    });
    cy.visit(`/${depEnv}/form_module/manage?fm=${formModuleData.id}`);
    cy.wait(['@formModule', '@formModuleVersions']);

    cy.get('input[role="switch"]').invoke('attr', 'aria-checked').should('eq', 'true');
    
    cy.intercept('GET', `/${depEnv}/api/v1/form_modules/${formModuleData.id}`, {
      fixture: 'formModules/disabledFormModule',
      times: 1
    }).as('formModule');

    cy.get('input[role="switch"]').parent().click();
    cy.get('button').contains('Disable').click();
    cy.wait(['@formModule']);
    cy.get('input[role="switch"]').invoke('attr', 'aria-checked').should('eq', 'false');
  });

  it('Updates a form module version', () => {
    cy.intercept('GET', `/${depEnv}/api/v1/form_modules/${formModuleData.id}/version`, {
      fixture: 'formModules/formModuleVersions',
    }).as('formModuleVersions');
    cy.intercept('PUT', `/${depEnv}/api/v1/form_modules/${formModuleData.id}`, {
      statusCode: 200,
      body: updatedFormModuleData
    });
    cy.visit(`/${depEnv}/form_module/manage?fm=${formModuleData.id}`);
    cy.wait(['@formModule', '@formModuleVersions']);

    cy.intercept('GET', `/${depEnv}/api/v1/form_modules/${formModuleData.id}/version/${formModuleVersionData.id}`, {
      fixture: 'formModules/formModuleVersion',
      times: 1
    }).as('formModuleVersion');

    cy.get('strong').contains('Form Module Versions').parent().parent().next().find('a').click();
    cy.wait(['@formModuleVersion']);

    cy.intercept('PUT', `/${depEnv}/api/v1/form_modules/${formModuleData.id}/version/${formModuleVersionData.id}`, {
      statusCode: 200,
      body: updatedFormModuleVersionData,
      times: 1
    }).as('updateFormModuleVersion');

    cy.intercept('GET', `/${depEnv}/api/v1/form_modules/${formModuleData.id}/version/${formModuleVersionData.id}`, {
      fixture: 'formModules/updatedFormModuleVersion',
      times: 1
    }).as('getFormModuleVersion');

    cy.get('textarea[name="importData"]').clear().type(JSON.stringify(updatedFormModuleVersionData.importData), {parseSpecialCharSequences: false, delay: 0});
    let uris = cy.get('div').contains('External URIs').next().find('input');
    uris.each(($el, index) => {
      cy.wrap($el).clear().type(updatedFormModuleVersionData.externalUris[index], {parseSpecialCharSequences: false, delay: 0});
    });

    cy.get('button').contains('Update').click();
    cy.wait(['@updateFormModuleVersion', '@getFormModuleVersion']);

    cy.get('textarea[name="importData"]').should('have.value', JSON.stringify(updatedFormModuleVersionData.importData));
    uris = cy.get('div').contains('External URIs').next().find('input');
    uris.each(($el, index) => {
      cy.wrap($el).should('have.value', updatedFormModuleVersionData.externalUris[index]);
    });
  });

  it('Imports a form module version', () => {
    cy.intercept('GET', `/${depEnv}/api/v1/form_modules/${formModuleData.id}/version`, {
      fixture: 'formModules/formModuleVersions',
      times: 1,
    }).as('formModuleVersions');
    cy.visit(`/${depEnv}/form_module/manage?fm=${formModuleData.id}`);
    cy.wait(['@formModule', '@formModuleVersions']);
    cy.get('tbody').find('tr').should('have.length', 1);
    cy.get('i').contains('add_circle').parent().parent().parent().click();
    cy.location('pathname').should('eq', `/${depEnv}/form_module/add_version`);
    cy.location('search').should('eq', `?fm=${formModuleData.id}`);
    cy.intercept('POST', `/${depEnv}/api/v1/form_modules/${formModuleData.id}/version`, {
      statusCode: 200,
      body: secondFormModuleVersionData
    });
    
    cy.get('textarea[name="importData"]').clear().type(JSON.stringify(secondFormModuleVersionData.importData), {parseSpecialCharSequences: false, delay: 0});let uris = cy.get('div').contains('External URIs').next().find('input');
    uris.each(($el, index) => {
      cy.wrap($el).clear().type(secondFormModuleVersionData.externalUris[index], {parseSpecialCharSequences: false, delay: 0});
    });

    cy.intercept('GET', `/${depEnv}/api/v1/form_modules/${formModuleData.id}/version`, {
      fixture: 'formModules/secondFormModuleVersions',
      times: 1,
    }).as('formModuleVersions');

    cy.get('button').contains('Submit').click();
    cy.wait(['@formModule', '@formModuleVersions']);
    cy.get('tbody').find('tr').should('have.length', 2);
  });
});
