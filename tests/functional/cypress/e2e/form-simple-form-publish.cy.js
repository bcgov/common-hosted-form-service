import 'cypress-keycloak-commands';
import 'cypress-drag-drop';
import { formsettings } from '../support/login.js';

const depEnv = Cypress.env('depEnv');

Cypress.Commands.add('waitForLoad', () => {
  const loaderTimeout = 60000;

  cy.get('.nprogress-busy', { timeout: loaderTimeout }).should('not.exist');
});

describe('Form Designer', () => {

  beforeEach(()=>{
    
    cy.on('uncaught:exception', (err, runnable) => {
      // Form.io throws an uncaught exception for missing projectid
      // Cypress catches it as undefined: undefined so we can't get the text
      console.log(err);
      return false;
    });
  });
  it('Visits the form settings page', () => {
    
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    formsettings();
  });  
// Publish a simple form with Simplebc Address component
 it('Checks simplebcaddress and form submission', () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    
    cy.get('button').contains('BC Government').click();
    cy.get('div.formio-builder-form').then($el => {
      const coords = $el[0].getBoundingClientRect();
      cy.get('[data-key="simplebcaddress"]')
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -550, { force: true }) 
      .trigger('mouseup', { force: true });
      cy.waitForLoad();
      cy.get('button').contains('Save').click();
      cy.wait(2000);
    });
  // Form saving
    let savedButton = cy.get('[data-cy=saveButton]');
    expect(savedButton).to.not.be.null;
    savedButton.trigger('click');
    cy.wait(2000);
  // Filter the newly created form
    cy.location('search').then(search => {
      //let pathName = fullUrl.pathname
    let arr = search.split('=');
    let arrayValues = arr[1].split('&');
    cy.log(arrayValues[0]);
    cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
    cy.wait(2000);
    });
  });
  it('Validate Ministry list', () => {
    cy.viewport(1000, 1100);
    cy.wait(2000);
      //Edit the form settings
    cy.get(':nth-child(1) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay').click();
    cy.get('[lang="en"] > .v-btn > .v-btn__content > .mdi-pencil').click();
    cy.wait(2000);
    // Verfiy Ministry/Organization List
    cy.get('.v-row > :nth-child(1) > .v-input > .v-input__control > .v-field > .v-field__append-inner').click();
    cy.contains("Citizens' Services (CITZ)").should('exist');
    cy.contains('Agriculture and Food (AF)').should('exist');
    cy.contains('Attorney General (AG)').should('exist');
    cy.contains('Crown Agencies and Board Resourcing Office (CABRO)').should('exist');
    cy.contains('Compliance & Enforcement Collaborative (CEC)').should('exist');
    cy.contains('Corporate Information and Records Management Office (CIRMO)').should('exist');
    cy.contains('Elections BC(EBC)').should('exist');
    cy.contains('Education and Child Care (ECC)').should('exist');
    cy.contains('Emergency Management and Climate Readiness (EMCR)').should('exist');
    cy.contains('Environment and Parks (ENV)').should('exist');
    cy.contains('Finance (FIN)').should('exist');
    cy.contains('Forests (FOR)').should('exist');
    cy.contains('Government Communications and Public Engagement (GCPE)').should('exist');
    cy.contains('Housing and Municipal Affairs (HMA)').should('exist');
    cy.contains('Health (HLTH)').should('exist');
    cy.contains('Intergovernmental Relations Secretariat (IGRS)').should('exist');
    cy.contains('Ministry of Infrastructure (INFR)').should('exist');
    cy.contains('Indigenous Relations & Reconciliation (IRR)').should('exist');
    cy.contains('Jobs, Economic Development and Innovation (JEDI)').should('exist');
    cy.contains('Labour (LBR)').should('exist');
    cy.contains('Children and Family Development (MCF)').should('exist');
    cy.contains('Mining and Critical Materials (MCM)').should('exist');
    cy.contains('Office of the Comptroller General (OCG)').should('exist');
    cy.contains('Office of the Chief Information Officer (OCIO)').should('exist');
    cy.contains('Office of the Premier (PREM)').should('exist');
    cy.contains('BC Public Service Agency (PSA)').should('exist');
    cy.contains("Public Sector Employers' Council Secretariat (PSECS)").should('exist');
    cy.contains('Post-Secondary Education and Future Skills (PSFS)').should('exist');
    cy.contains('Public Safety and Solicitor General (PSSG)').should('exist');
    cy.contains('Provincial Treasury (PT)').should('exist');
    cy.contains('Social Development and Poverty Reduction (SDPR)').should('exist');
    cy.contains('Tourism, Arts, Culture and Sport (TACS)').should('exist');
    cy.contains('Treasury Board Staff (TB)').should('exist');
    cy.contains('Transportation and Transit (TRAN)').should('exist');
    cy.contains('Water, Land and Resource Stewardship (WLRS)').should('exist');
    cy.contains('Agriculture and Food (AF)').click();
    //Update form settings
    cy.get('[data-test="canEditForm"]').click();
    //Publish the form
    cy.get('[data-cy="formPublishedSwitch"] > .v-input__control > .v-selection-control > .v-label > span').click();
    cy.get('span').contains('Publish Version 1');
    cy.contains('Continue').should('be.visible');
    cy.contains('Continue').trigger('click');
      //Delete form after test run
    cy.get(':nth-child(5) > .v-btn > .v-btn__content > .mdi-delete').click();
    cy.get('[data-test="continue-btn-continue"]').click();
    cy.get('#logoutButton > .v-btn__content > span').click();
  }); 
    
});