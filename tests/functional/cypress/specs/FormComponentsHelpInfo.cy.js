import 'cypress-keycloak-commands';

const baseUrl = Cypress.env('baseUrl');
const appUrl = Cypress.env('appUrl');
const depEnv = Cypress.env('depEnv');


Cypress.Commands.add('waitForLoad', () => {
  const loaderTimeout = 60000;

  cy.get('.nprogress-busy', { timeout: loaderTimeout }).should('not.exist');
});


Cypress.Commands.overwrite('log', (subject, message) => cy.task('log', message));


describe('Application About Page', () => {

  beforeEach(() => {
    cy.waitForLoad();
    cy.kcLogout();
    cy.kcLogin("user");
    cy.visit(`${depEnv}`);
    cy.visit(`${depEnv}/admin/`);


    cy.intercept({https: false,
      method:'GET',
      path:`${depEnv}/api/v1/forms/formComponents/helpInfo/list`},
      {fixture: 'formInitialBuilder/ccHelpLinkInfoList.json'}).as('getCommonCompLinkInfo');


      cy.intercept({https: false,
        method:'GET',
        path:`/${depEnv}/api/v1/formsformComponents/helpInfo/true/simplecols2`},
        {fixture: 'formInitialBuilder/ccHelpLinkInfoList.json'},
        (req) => {
          body: reqBody
          req.continue()
      }).as('publishComponent');


  });

  it('Visits the admin page', () => {
    cy.get('[data-cy=infoLinks]').click().contains('Info Links');
  });

  it('Visits Info Links in Admin Page', () => {
    //cy.visit(`${depEnv}/admin/`);
    cy.get('[data-cy=infoLinks]').click();
    let children = cy.get('[data-cy=info_link_expansion_panels]').children();
    children.should('have.length.gt', 1);

  });



  it('Visits layout/group edit button in Info Links ', () => {
    cy.visit(`${depEnv}/admin/`);
    cy.get('[data-cy=infoLinks]').click();
    let children = cy.get('[data-cy=info_link_expansion_panels]').children();
    children.should('have.length.gt', 1);

    //get the first panel/first group of the form builder layout groups
    let firstChild = children.first();

    firstChild.click();

    let editButton = firstChild.find('[data-cy=edit_button]').first();
    expect(editButton).to.not.be.null;
    editButton.click();


    //this open the information link dialog box when the edit button above is clicked
    let proactiveHelpPreviewDialog = firstChild.get('.v-dialog');
    proactiveHelpPreviewDialog.should('be.visible');

    let moreHelpInfoLinkTextField = cy.get('[data-cy=more_help_info_link_text_field]');
    moreHelpInfoLinkTextField.should('be.disabled');

    let moreHelpInfoLinkCheckBox = cy.get('.checkbox_data_cy');
    //cy.get('.container-data-cy');
    moreHelpInfoLinkCheckBox.click();
    moreHelpInfoLinkTextField.should('not.be.disabled');


    let fileUploadInputField = cy.get('input[type=file]');
    fileUploadInputField.should('not.to.be.null');
    fileUploadInputField.attachFile('add1.png');

    //upload image to bucket by calling COMS
    //cy.fixture('formInitialBuilder/add1.png','base64').then((logo)=>{
      //let imageData = {componentName:"TestImage",image:logo}
      cy.intercept('POST', `${depEnv}/api/v1/admin/formComponents/helpInfo/upload`,).as('upload');

      cy.wait('@upload').then((data) => {
        expect(data.response.body).to.not.be.null;
        expect(data.response.body.key).to.not.be.undefined;
      });
   // })


    //input external link for form component help link into desribtion text area
    cy.get('[data-cy=more_help_info_link_text_field]')
    .type('https://www.google.com/')
    .trigger('keydown', {
      key: 'Enter',
    });

    //input text into desribtion text area
    cy.get('[data-cy=more_help_info_link_text_area]')
    .type("Lorem Ipsum is")
    .trigger('keydown', {
      key: 'Enter',
    });


    //submit form component help link details to backend
    cy.get('[data-cy=more_help_info_link_save_button]').click();

    cy.wait('@getCommonCompLinkInfo').then((data) => {
      expect(data.response.body).to.not.be.null;
    });

  });


  it('layout/group preview button in Info Links should be enabled ', () => {

    cy.visit(`${depEnv}/admin/`);
    cy.get('[data-cy=infoLinks]').click();
    let children = cy.get('[data-cy=info_link_expansion_panels]').children();
    children.should('have.length.gt', 1);

    //get the first panel/first group of the form builder layout groups
    let firstChild = children.first();

    firstChild.click();

    let previewButton = firstChild.find('[data-cy=preview_button]').first();
    expect(previewButton).to.not.be.null;
    previewButton.should('not.be.disabled');
    previewButton.click();

    let proactiveHelpPreviewDialog = firstChild.get('.v-dialog');
    proactiveHelpPreviewDialog.should('be.visible');

    let previewTextField = firstChild.find('[data-cy=preview_text_field]').first();
    expect(previewTextField).to.not.be.null;
    previewTextField.should('not.be.empty');


  });

  it('layout/group publish/unpublish switch ', () => {

    cy.visit(`${depEnv}/admin/`);
    cy.get('[data-cy=infoLinks]').click();
    let children = cy.get('[data-cy=info_link_expansion_panels]').children();
    children.should('have.length.gt', 1);

    //get the first panel/first group of the form builder layout groups
    let firstChild = children.first();

    firstChild.click();

    let published_unpublishedButton = firstChild.find('[data-cy=status_button]').first();
    expect(published_unpublishedButton).to.not.be.null;

    //published_unpublishedButton.click;

    //published_unpublishedButton.trigger('change');

    //cy.wait('@publishComponent').then((data) => {
     // cy.log(data);
    //});


  });

});