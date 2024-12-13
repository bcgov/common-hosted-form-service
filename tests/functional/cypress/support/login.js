export function formsettings(){

    const depEnv = Cypress.env('depEnv');
    const username=Cypress.env('keycloakUsername');
    const password=Cypress.env('keycloakPassword');
    
    
    
    if(depEnv=="app")
    {
        cy.visit(`https://chefs-dev.apps.silver.devops.gov.bc.ca/app`);
    }
    else
    {
       
        cy.visit(`/${depEnv}`);
        
    }
    cy.get('#logoutButton > .v-btn__content > span').should('not.exist');
    cy.get('[data-test="base-auth-btn"] > .v-btn > .v-btn__content > span').click();
    cy.get('[data-test="idir"]').click();
    
    cy.get('#user').type(username);
    cy.get('#password').type(password);
    cy.get('.btn').click();
    cy.get('[data-cy="help"]')
    .should("have.attr", "href", "https://developer.gov.bc.ca/docs/default/component/chefs-techdocs")
    .should("have.text", "Help");
    cy.get('[data-cy="feedback"]')
    .should("have.attr", "href", "https://chefs-fider.apps.silver.devops.gov.bc.ca/")
    .should("have.text", "Feedback");
    cy.get('[data-cy="createNewForm"]').click();
    cy.get('.v-row > :nth-child(1) > .v-card > .v-card-title > span').contains('Form Title');

    let title="title" + Math.random().toString(16).slice(2);

    cy.get('[data-test="text-name"]').type(title);
    
    cy.get('[data-test="text-description"]').type('test description');
    
    cy.get('input[value="public"]').click();
    cy.get('.v-selection-control-group > .v-card').should('be.visible');
    cy.get('input[value="login"]').click();
    cy.get('.v-row > .v-input > .v-input__control > .v-selection-control-group > :nth-child(1) > .v-label > span').contains('IDIR');
    cy.get('span').contains('Basic BCeID');
    
    cy.get(':nth-child(2) > .v-card > .v-card-text > .v-input--error > :nth-child(2)').contains('Please select 1 log-in type');
   
    cy.get('input[value="team"]').click();
    cy.get('.v-label > .mdi-help-circle-outline').click();
    cy.contains('Add team members from the Team Management settings after creating this form.').should('be.visible');
    cy.get('.v-label > div > .mdi-help-circle-outline').then($el => {
    const email_notify=$el[1];
    
    cy.get(email_notify).click({force: true});
    cy.contains('Send a notification to your specified email address when any user submits this form').should('be.visible');
    });
    cy.get('[data-test="canSaveAndEditDraftsCheckbox"]').click();
    cy.get(':nth-child(3) > .v-card > .v-card-text > :nth-child(2) > .v-input__control > .v-selection-control > .v-label > span').click();//Update the status of the form
    cy.get(':nth-child(5) > .v-input__control > .v-selection-control > .v-label > div > span > strong').click();//Copy existing submission
    cy.get(':nth-child(7) > .v-input__control > .v-selection-control > .v-label > div').click();//Wide form Layout
    cy.get('[data-test="email-test"] > .v-input__control > .v-selection-control > .v-label > div > span').click({force: true});
    cy.get('[data-test="email-test"] > .v-input__control > .v-selection-control > .v-label > div > span').click();
    cy.get(':nth-child(4) > .v-card > .v-card-text > .v-text-field > .v-input__control > .v-field > .v-field__field > .v-field__input').type('abc@gmail.com');
    cy.get('.mb-6 > .mdi-help-circle-outline').should('exist');
    cy.get('a.preview_info_link_field_white').then($el => {
    const drftupload=$el[0];
    const copy_sub=$el[1];
    const wide_layput=$el[3];
    const metadata=$el[4];
    cy.get(drftupload).should("have.attr", "href", "https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/Allow-multiple-draft-upload/");
    cy.get(copy_sub).should("have.attr", "href", "https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/Copy-an-existing-submission/");
    cy.get(wide_layput).should("have.attr", "href", "https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/Wide-Form-Layout");
    cy.get(metadata).should("have.attr", "href", "https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Integrations/Form-Metadata/");
    });
    //Validate Form Meta Data section
    cy.get('textarea').then($el => {

        const metadata=$el[1];
        cy.get(metadata).click({force: true});
        cy.get('[data-test="json-test"]').type('{selectall}{backspace}');
        cy.get('.v-messages__message').contains('Form metadata must be valid JSON. Use double-quotes around attributes and values.').should('exist');
        cy.get('[data-test="json-test"]').type('{}');
        
        
    });
   
    cy.get('.v-row > :nth-child(1) > .v-input > .v-input__control > .v-field > .v-field__append-inner').click();
    cy.contains("Citizens' Services (CITZ)").click();
    cy.get('.mb-4 > .mdi-help-circle-outline').click();
    cy.contains('If you do not see your specific use case, contact the CHEFS team to discuss further options').should('be.visible');

    cy.get('[data-test="case-select"]').click();
    cy.get('.v-list').should('contain','Applications that will be evaluated followed');
    cy.get('.v-list').should('contain','Collection of Datasets, data submission');
    cy.get('.v-list').should('contain','Registrations or Sign up - no evaluation');
    cy.get('.v-list').should('contain','Reporting usually on a repeating schedule or event driven like follow-ups');
    cy.get('.v-list').should('contain','Feedback Form to determine satisfaction, agreement, likelihood, or other qualitative questions');
    cy.contains('Reporting usually on a repeating schedule or event driven like follow-ups').click();
    
    cy.get('input[value="test"]').click();
    ;
    cy.get('[data-test="api-true"] > .v-label > span').click();
    cy.get('.mt-3 > .mdi-help-circle-outline').should('be.visible');
    cy.get('.mt-3 > .mdi-help-circle-outline').click();
    cy.contains('Labels serve as a means to categorize similar forms that may belong to a common organization or share a related context.').should('be.visible');
    cy.get('.d-flex > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.get('.d-flex > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').type('test label');
    cy.get(':nth-child(4) > .v-card-text > .v-input > .v-input__control > .v-selection-control > .v-label > span').click();
    cy.get('button').contains('Continue').click();

}