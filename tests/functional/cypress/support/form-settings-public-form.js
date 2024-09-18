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
    Cypress.Commands.add('waitForLoad', () => {
        const loaderTimeout = 60000;
      
        cy.get('.nprogress-busy', { timeout: loaderTimeout }).should('not.exist');
    });
    
    cy.get('[data-test="base-auth-btn"] > .v-btn > .v-btn__content > span').click();
    cy.get('[data-test="idir"]').click();
    
    cy.get('#user').type(username);
    cy.get('#password').type(password);
    cy.get('.btn').click();
    cy.get('[data-cy="createNewForm"]').click();
    cy.get('.v-row > :nth-child(1) > .v-card > .v-card-title > span').contains('Form Title');

    let title="title" + Math.random().toString(16).slice(2);

    
   
    cy.get('[data-test="text-name"]').type(title);
    
    cy.get('[data-test="text-description"]').type('test description');
    
    cy.get('input[value="public"]').click();
    cy.waitForLoad();
    cy.get('[data-test="text-description"]').type('test description');
    
    
    cy.get(':nth-child(3) > .v-card > .v-card-text > :nth-child(2) > .v-input__control > .v-selection-control > .v-label > span').click();//Update the status of the form
    cy.get('input[type="checkbox"]').then($el => {

        

        
            const rem=$el[0];//save and edit drafts
            const rem2=$el[2];//multiple draft upload
            const rem3=$el[3];//form submission schedule settings
            const rem4=$el[4];//copy submission
            const rem5=$el[5];//event subscription
            cy.get(rem).should("not.be.enabled");
            cy.get(rem2).should("not.be.enabled");
            cy.get(rem3).should("not.be.enabled");
            cy.get(rem4).should("not.be.enabled");
            cy.get(rem5).should("not.be.enabled");
        
          
    });
    
    cy.get(':nth-child(7) > .v-input__control > .v-selection-control > .v-label > div').click();//Wide form Layout
    
    cy.get('[data-test="email-test"] > .v-input__control > .v-selection-control > .v-label > div > span').click();
    cy.get(':nth-child(4) > .v-card > .v-card-text > .v-text-field > .v-input__control > .v-field > .v-field__field > .v-field__input').type('abc@gmail.com');
   
    cy.get('.v-row > :nth-child(1) > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.contains("Citizens' Services (CITZ)").click();
    
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
    cy.get('.d-flex > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').click();
    cy.get('.d-flex > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input').type('test label');
    cy.get(':nth-child(4) > .v-card-text > .v-input > .v-input__control > .v-selection-control > .v-label > span').click();
    cy.get('button').contains('Continue').click();

}