export function formsettings(){





    const depEnv = Cypress.env('depEnv');
    const username=Cypress.env('keycloakUsername');
    const password=Cypress.env('keycloakPassword');
    
    
    
    cy.visit(`/${depEnv}`);
    cy.get('[data-test="base-auth-btn"] > .v-btn > .v-btn__content > span').click();
    cy.get('[data-test="idir"]').click();
    
    cy.get('#user').type(username);
    cy.get('#password').type(password);
    cy.get('.btn').click();
    cy.get('[data-cy="createNewForm"]').click();
    cy.get('.v-row > :nth-child(1) > .v-card > .v-card-title > span').contains('Form Title');

    let title="title" + Math.random().toString(16).slice(2);

    
    cy.get('#input-15').type(title);
    cy.get('#input-17').type('test description');
    cy.get('#input-22').click();
    cy.get('.v-selection-control-group > .v-card').should('be.visible');
    cy.get('#input-23').click();
    cy.get('.v-row > .v-input > .v-input__control > .v-selection-control-group > :nth-child(1) > .v-label > span').contains('IDIR');
    cy.get('span').contains('Basic BCeID');
    
    cy.get(':nth-child(2) > .v-card > .v-card-text > .v-input--error > :nth-child(2)').contains('Please select 1 log-in type');
    cy.get('#input-24').click();
    cy.get('#checkbox-25').click();
    cy.get('#checkbox-28').click();
    cy.get('#checkbox-38').click();
    cy.get('#checkbox-54').click();
    cy.get('#input-92').click();
    cy.get('#input-92').type('abc@gmail.com');
    cy.get('#input-58').click();
    cy.contains("Citizens' Services (CITZ)").click();
    cy.get('#input-62').click();
    cy.get('.v-list').should('contain','Applications that will be evaluated followed');
    cy.get('.v-list').should('contain','Collection of Datasets, data submission');
    cy.get('.v-list').should('contain','Registrations or Sign up - no evaluation');
    cy.get('.v-list').should('contain','Reporting usually on a repeating schedule or event driven like follow-ups');
    cy.get('.v-list').should('contain','Feedback Form to determine satisfaction, agreement, likelihood, or other qualitative questions');
    cy.contains('Reporting usually on a repeating schedule or event driven like follow-ups').click();
    cy.get('#input-69').click();
    cy.get('#input-75').click();
    cy.get('.mt-3 > .mdi-help-circle-outline').should('be.visible')
    cy.get('.mt-3 > .mdi-help-circle-outline').click();
    cy.get('.d-flex > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.get('.d-flex > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').type('test label');
    cy.get('#checkbox-80').click();
    cy.get('button').contains('Continue').click();





}