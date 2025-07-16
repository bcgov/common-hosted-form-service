import 'cypress-keycloak-commands';
import { formsettings } from '../support/login.js';

const depEnv = Cypress.env('depEnv');
const username=Cypress.env('keycloakUsername');
const password=Cypress.env('keycloakPassword');


Cypress.Commands.add('waitForLoad', () => {
  const loaderTimeout = 60000;

  cy.get('.nprogress-busy', { timeout: loaderTimeout }).should('not.exist');
});

describe('Form Designer', () => {

  beforeEach(()=>{
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });
  it('Visits the form settings page', () => {
    
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    formsettings();
    
  });  
// Publish a simple form with Simplebc Address component
 it('Verify public form submission', () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    
    cy.get('button').contains('Basic Fields').click();
    cy.get('div.formio-builder-form').then($el => {
      const coords = $el[0].getBoundingClientRect();
      cy.get('span.btn').contains('Text Field')
      
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -110, { force: true })
      .trigger('mouseup', { force: true });
      cy.get('button').contains('Save').click();
      cy.waitForLoad();
    });
    cy.get('button').contains('BC Government').click();
    cy.get('div.formio-builder-form').then($el => {
        const coords = $el[0].getBoundingClientRect();
        cy.get('[data-type="simplefile"]')
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -400, { force: true })
          //.trigger('mousemove', coords.y, +100, { force: true })
        .trigger('mouseup', { force: true });
        cy.waitForLoad();  
        cy.get('button').contains('Save').click();
    });
  // Form saving
    let savedButton = cy.get('[data-cy=saveButton]');
    expect(savedButton).to.not.be.null;
    cy.get('.mdi-content-save').should('be.visible').trigger('click');
    cy.wait(2000);
  // Filter the newly created form
    cy.location('search').then(search => {
      //let pathName = fullUrl.pathname
      let arr = search.split('=');
      let arrayValues = arr[1].split('&');
      cy.log(arrayValues[0]);
      cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
      cy.waitForLoad();
    //Publish the form
    cy.get('.v-label > span').click();

    cy.get('span').contains('Publish Version 1');

    cy.contains('Continue').should('be.visible');
    cy.contains('Continue').trigger('click');
    //Share link verification
    let shareFormButton = cy.get('[data-cy=shareFormButton]');
    expect(shareFormButton).to.not.be.null;
    shareFormButton.trigger('click').then(()=>{
      
    let shareFormLinkButton=cy.get('.mx-2');
    expect(shareFormLinkButton).to.not.be.null;
    shareFormLinkButton.trigger('click');
    cy.get('.mx-2 > .v-btn').click();
    })
    cy.visit(`/${depEnv}`);
    cy.get('[data-cy="userFormsLinks"]').click();
    cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
    cy.waitForLoad();
    cy.get(':nth-child(1) > .v-expansion-panel > .v-expansion-panel-title > .v-expansion-panel-title__overlay').click();
    cy.get('[lang="en"] > .v-btn > .v-btn__content > .mdi-pencil').click();
    cy.get('[data-test="userType"] > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.contains('Public (anonymous)').click();
    cy.waitForLoad();
    cy.get('input[type="checkbox"]').then($el => {
            const rem=$el[0];//save and edit drafts
            const rem1=$el[1];//Reviewers can update the status
            const rem2=$el[2];//display assignee column
            //const rem3=$el[3];//multiple draft upload
            const rem4=$el[4];//form submission schedule settings
            const rem5=$el[5];//copy existing submission
            const rem6=$el[6];//Event Subscription
            const rem7=$el[7];//Wide form layout
            const rem8=$el[8];//Share draft with team members
            cy.get(rem).should("not.be.enabled");
            cy.get(rem1).should("be.enabled");
            cy.get(rem2).should("be.enabled");
            //cy.get(rem3).should("be.enabled");
            cy.get(rem4).should("be.enabled");
            cy.get(rem5).should("not.be.enabled");
            cy.get(rem6).should("be.enabled"); 
            cy.get(rem7).should("be.enabled");
            cy.get(rem8).should("not.be.enabled");      
    });
    cy.get('[data-test="canEditForm"]').click();
    //Check team management functionality for public forms
    
    cy.get('[data-test="canManageTeammembers"]').click();
    cy.get('.mdi-account-plus').click();
    //Search for a member to add
    cy.get('.v-col > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.get('.v-col > .v-btn--variant-outlined > .v-btn__content > span').click();
    cy.wait(3000);
    cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
    cy.waitForLoad();
      //Logout to submit the public form
    cy.get('#logoutButton > .v-btn__content > span').should('be.visible').click({ force: true });
    cy.log('Page visited, checking for logout button');
    cy.get('#logoutButton > .v-btn__content > span').should('not.exist');
    
    //Form submission and verification for public forms
    cy.visit(`/${depEnv}/form/submit?f=${arrayValues[0]}`);
    cy.waitForLoad();
    cy.get('button').contains('Submit').should('be.visible');
    cy.wait(2000);
    cy.contains('Text Field').click();
    cy.contains('Text Field').type('Alex');
    //Uplaod file
    cy.get('.browse').should('have.attr', 'ref').and('include', 'fileBrowse');
    cy.get('.browse').should('have.attr', 'href').and('include', '#');
    cy.get('.browse').click();
    let fileUploadInputField = cy.get('input[type=file]');
    cy.get('input[type=file]').should('not.to.be.null');
    fileUploadInputField.attachFile('add1.png');
    cy.waitForLoad();
    //verify file uploads to object storage
    cy.get('.col-md-9 > a').should('have.attr', 'ref').and('include', 'fileLink');
    cy.get('div.col-md-2').contains('61.48 kB');
    cy.wait(1000);
    //Remove uploaded file
    cy.get('i[class="fa fa-remove"]').click();
    //Add invalid type files
    cy.get('.browse').click();
    let fileUploadInputFields = cy.get('input[type=file]');
    cy.get('input[type=file]').should('not.to.be.null');
    fileUploadInputFields.attachFile('test_files_public.html');
    //Verify validation message
    cy.get('div[class="alert alert-danger bg-error"]').contains('This file type is not supported for security reasons.').should('be.visible');
    cy.get('i[class="fa fa-remove"]').click();
    cy.wait(1000);
    //Add valid type file again
    cy.get('.browse').click();
    let fileUploadInputFields1 = cy.get('input[type=file]');
    cy.get('input[type=file]').should('not.to.be.null');
    fileUploadInputFields1.attachFile('add1.png');
    cy.wait(1000);
    //form submission
    cy.get('button').contains('Submit').click();
    //cy.get('[data-test="continue-btn-continue"]').click({force: true});
    cy.wait(2000);
    cy.get('label').contains('Text Field').should('be.visible');
    cy.get('label').contains('Text Field').should('be.visible');
    cy.location('pathname').should('eq', `/${depEnv}/form/success`);
    cy.wait(1000);
    cy.contains('h1', 'Your form has been submitted successfully');
    //Verify download is disabled for public form
    cy.get('li[class="list-group-item list-group-header hidden-xs hidden-sm"]').should('exist');
    cy.get('.col-md-9 > a').contains('add1.png').should('not.be.enabled');
    if(depEnv=="app")
          {
              cy.visit(`https://chefs-dev.apps.silver.devops.gov.bc.ca/app`);
          }
    else
          {
              cy.visit(`/${depEnv}`);
              
          }
          
    cy.get('[data-test="base-auth-btn"] > .v-btn > .v-btn__content > span').click();
    cy.get('[data-test="idir"]').click();
          
    cy.get('#user').type(username);
    cy.get('#password').type(password);
    cy.get('.btn').click();
    cy.wait(2000);
        //view submission
        
    cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
    cy.get('.mdi-list-box-outline').click();
    cy.waitForLoad();
    cy.contains('Assigned to me').should('exist');//Assigned to me checkbox
    //View the submission
    cy.get(':nth-child(7) > a > .v-btn').click();
    //Assign status submission
    cy.get('.status-heading > .mdi-chevron-right').click();
    //Edit submission
    cy.get('.mdi-pencil').click();
    //check visibility of cancel button
    cy.get('.v-col-2 > .v-btn').should('be.visible');
    cy.get('button').contains('Submit').should('be.visible');
    //Edit submission data
     cy.contains('Text Field').click();
    cy.contains('Text Field').type('Smith');
    cy.get('button').contains('Submit').click();
    cy.wait(2000);
    cy.get('[data-test="showStatusList"] > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.waitForLoad();
    cy.contains('ASSIGNED').should('be.visible');
    cy.contains('REVISED').should('not.exist');
    cy.contains('COMPLETED').should('be.visible');
    cy.contains('ASSIGNED').click();
    cy.get('[data-test="canAssignToMe"] > .v-btn__content > span').should('be.visible');
    cy.get('[data-test="showAssigneeList"] > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.get('[data-test="showAssigneeList"] > .v-input__control > .v-field > .v-field__field > .v-field__input').type('ch');
    cy.get('div').contains('CHEFS Testing').click();
    cy.get('[data-test="updateStatusToNew"] > .v-btn__content > span').click();
    cy.wait(2000);
    cy.get('[data-test="showStatusList"] > .v-input__control > .v-field > .v-field__field > .v-field__input').click({force: true});
    cy.wait(2000);
    cy.contains('COMPLETED');
    cy.contains('COMPLETED').click();
    cy.wait(2000);
    cy.get('button').contains('COMPLETE').click();
    //Adding notes to submission
    cy.get('.mdi-plus').click();
    cy.get('div').find('textarea').then($el => {

      const rem=$el[0];
      rem.click();
      cy.get(rem).type('some notes');
      cy.get('[data-test="btn-add-note"] > .v-btn__content > span').click();
      
      
    });
    //Verify  submitted by label is public
    cy.get('p').contains('public').should('be.visible');
    //Verify download is enabled for Reviewers
    cy.get('li[class="list-group-item list-group-header hidden-xs hidden-sm"]').should('exist');
    cy.wait(1000);
    cy.contains('add1.png').should('not.have.attr', 'disabled');
    cy.contains('add1.png').click();
    //Edit submission data for public form
    cy.get('.mdi-pencil').click();
    //check visibility of cancel button
    cy.get('.v-col-2 > .v-btn').should('be.visible');
    cy.get('button').contains('Submit').should('be.visible');
    cy.contains('Text Field').click();
    cy.contains('Text Field').type('Smith');
    cy.get('button').contains('Submit').click();
    cy.wait(2000);
    //Verify Edit History Panel
    cy.get('.mdi-history').click();
    cy.get('.v-data-table__tr> :nth-child(1)').contains('CHEFSTST@idir').should('be.visible');
    cy.get('span').contains('Close').click();
    cy.get('.mdi-list-box-outline').click();
    cy.waitForLoad();
    cy.get('.mdi-cog').click();
    //Delete form after test run
    cy.waitForLoad();
    //cy.get(':nth-child(5) > .v-btn > .v-btn__content > .mdi-delete').click();
    //cy.get('[data-test="continue-btn-continue"]').click();
    //
    //Delete form after test run
    cy.get('[data-test="canRemoveForm"]').then($el => {
      const delform=$el[0];
      cy.get(delform).click();
    })
    cy.get('[data-test="continue-btn-continue"]').click();
    cy.get('#logoutButton > .v-btn__content > span').click();
    
    }); 
  });

});
