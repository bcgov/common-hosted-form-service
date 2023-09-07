import 'cypress-keycloak-commands';

import { IdentityProviders } from '../../../../app/frontend/src/utils/constants';

const depEnv = Cypress.env('depEnv');

const formModuleData = {
  id: '80b8df4c-2ac1-4fbd-ac5d-9483a4775141',
  pluginName: 'Test Plugin',
  idp: [
    'idir'
  ],
  importData: '{}',
  externalUris: [
    'https://jasonchung1871.github.io/chefs_modules/bcgov-formio-components.css'
  ],
};

const formModuleVersionData = {
  id: '34f7c083-fc24-475a-9e06-57db1808ef5f'
};

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
  });
  /*
  it('Visits the admin page', () => {
    cy.intercept('GET', `/${depEnv}/api/v1/form_modules?active=true`, {
      fixture: 'formModules/activeFormModules.json'
    }).as('formModules');

    cy.visit(`/${depEnv}/admin`);
    cy.wait(['@formModules']);
    cy.contains('Admin');
    cy.location('pathname').should('eq', `/${depEnv}/admin`);
    cy.contains('Form Modules');
    cy.get('div.v-tab').contains('Form Modules').click();
    cy.contains('Default Components');
    cy.get('button').contains('Manage').click();
  });
  */
  
 /* it('Imports a form module', () => {
    cy.intercept('POST', `/${depEnv}/api/v1/form_modules`, {
      statusCode: 200,
      body: {
        id: formModuleData.id,
        pluginName: formModuleData.pluginName,
        active: true,
        createdBy: 'test',
        createdAt: '2022-07-18T23:49:16.086Z',
        updatedBy: null,
        updatedAt: '2022-07-18T23:49:16.086Z',
        formModuleVersions: [],
        identityProviders: [{
          "code":"idir",
          "display":"IDIR",
          "active":true,
          "idp":"idir",
          "createdBy":"migration-002",
          "createdAt":"2022-07-04T18:51:39.791Z",
          "updatedBy":null,
          "updatedAt":"2022-07-04T18:51:39.791Z"
        }]
      }
    }).as('importFormModule');
    cy.intercept('POST', `/${depEnv}/api/v1/form_modules/${formModuleData.id}/version`, {
      statusCode: 200,
      body: {
        id: formModuleVersionData.id,
        formModuleId: formModuleData.id,
        externalUris: formModuleData.externalUris,
        importData: formModuleData.importData,
        createdBy: 'test',
        createdAt: '2022-07-18T23:49:16.086Z',
        updatedBy: null,
        updatedAt: '2022-07-18T23:49:16.086Z',
      }
    }).as('importFormModuleVersion');

    cy.visit(`/${depEnv}/form_module/import`);
    cy.contains('Import Form Module');
    cy.location('pathname').should('eq', `/${depEnv}/form_module/import`);
    cy.get('input[name="pluginName"]').type(formModuleData.pluginName);
    Object.values(IdentityProviders).forEach((constant_idp) => {
      formModuleData.idp.forEach((import_idp) => {
        if (import_idp === constant_idp) {
          cy.get(`input[value='${import_idp}']`).parent().click();
        }
      })
    });
    cy.get('textarea[name="importData"]').type(formModuleData.importData);
    for (let i = 1; i < formModuleData.externalUris.length; i++) {
      cy.get('button').contains('add').click();
    }
    let uris = cy.get('div').contains('External URIs').next().find('input');
    uris.each(($el, index) => {
      cy.wrap($el).type(formModuleData.externalUris[index]);
    });
    cy.get('button').contains('Submit').click();
    cy.wait(['@importFormModule', '@importFormModuleVersion']);
  });
  */
});
