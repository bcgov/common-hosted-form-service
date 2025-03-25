import 'cypress-keycloak-commands';
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
// Checks Map component functionalities
  it('Checks Map component for Point marker', () => {
      cy.viewport(1000, 1100);
      cy.waitForLoad();
      cy.get('button').contains('BC Government').click();
      cy.get('div.formio-builder-form').then($el => {
      const coords = $el[0].getBoundingClientRect();
      cy.get('[data-type="map"]')
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -550, { force: true })
      .trigger('mouseup', { force: true });
      cy.waitForLoad();
      cy.get('input[name="data[label]"]').type('s'); 
      cy.get('textarea[name="data[description]"]').should("have.attr","placeholder","This will appear below the map");
      cy.get('textarea[name="data[description]"]').type('Map location above');
      cy.wait(2000);
      cy.contains('Map location above').should('exist');
      cy.get('textarea[placeholder="Add a tooltip beside the label"]').type('Add your desired location');
      cy.wait(2000);
      cy.get('i[ref="tooltip"]').should('exist');
      cy.get('label').contains('Maps').should('exist');
      cy.get('div[data-value="top"]').should('exist');
      cy.get('input[name="data[customClass]"').should('exist');
      cy.get(':nth-child(2) > .nav-link').click();
      cy.wait(2000);
      cy.get('a[title="Draw a marker"]').then($el => {
        const marker_elem=$el[0];
        cy.get(marker_elem).click({force: true});
      });       
      cy.get('a[title="No layers to delete"]').then($el => {
        const layer_del_btn=$el[0];
        cy.get(layer_del_btn)
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -30, { force: true })
        .trigger('mouseup', { force: true });
      });
      cy.get('img[alt="Marker"]').click({ force: true });
      cy.wait(2000);
      cy.get('input[value="circle"]').click();
      cy.get('input[value="polygon"]').click();
      cy.get('input[value="polyline"]').click();
      cy.get('input[name="data[numPoints]"').type('{selectall}{backspace}');
      cy.get('input[name="data[numPoints]"').type('4');
      cy.wait(2000);
      });
    });
    it('Checks Map component for circle marker', () => {
      cy.viewport(1000, 1100);
      cy.waitForLoad(); 
      cy.get('a.leaflet-draw-draw-circle').then($el => {
        const draw_circle=$el[0];
      cy.get(draw_circle).click();
      });
      cy.get('img[alt="Marker"]').then($el => {
        const mark_cir=$el[0];
        const coords = $el[0].getBoundingClientRect();
        cy.get(mark_cir)
        .trigger('mousedown', { which: 1}, { force: true })
        .trigger('mousemove', coords.x, -5, { force: true })
        .trigger('mouseup', coords.x, -5, { force: true })
        cy.wait(2000);
        //Verify circular area drawn is exist on the map
        cy.get('.leaflet-interactive').should('exist');
        cy.wait(2000);
        cy.get('g').find('path[fill="#3388ff"]').should('exist');
      });
    });
    it('Checks Map component for Line marker', () => {

      cy.viewport(1000, 1100);
      cy.wait(3000);
      cy.get('a.leaflet-draw-draw-polyline').then($el => {
        const draw_line=$el[0];
      cy.get(draw_line).click();
      }); 
      cy.get('div[class="leaflet-draw-tooltip leaflet-draw-tooltip-single"]').click({ force: true });
      cy.get('a[title="No layers to delete"]').then($el => {
        const coords = $el[0].getBoundingClientRect();
        const layer_del_btn=$el[0];
        cy.get(layer_del_btn)
        .trigger('mousedown', { which: 1}, { force: true })
    //.trigger('mousemove', coords.x, -30, { force: true })
       .trigger('mousemove', coords.y, +350, { force: true })
       .trigger('mouseup', { force: true });
      });
      cy.get('.leaflet-interactive').then($el => {
        const interactive_btn=$el[1];
        cy.get(interactive_btn).click({ force: true });
      });
      //First click
      cy.get('div[class="leaflet-marker-icon leaflet-mouse-marker leaflet-zoom-hide leaflet-interactive"]').click({ force: true });
      cy.get('.leaflet-interactive').then($el => {
        const interactive_btn=$el[1];
        cy.get(interactive_btn).click({ force: true });
      });
      //second click
      cy.get('div[class="leaflet-marker-icon leaflet-mouse-marker leaflet-zoom-hide leaflet-interactive"]').click({ force: true });
      cy.get('.leaflet-interactive').then($el => {
        const interactive_btn=$el[1];
        cy.get(interactive_btn).click({ force: true });
      });
      //third click
      cy.get('div[class="leaflet-marker-icon leaflet-mouse-marker leaflet-zoom-hide leaflet-interactive"]').click({ force: true });
      cy.get('a[title="Finish drawing"]').click({ force: true });
      //To verify line is drwan on map
      cy.get('g').find('path[fill="none"]').should('exist');
      cy.wait(2000);
      // To view line drawn on map
      cy.get('div[class="leaflet-container leaflet-touch leaflet-fade-anim leaflet-touch-zoom leaflet-grab leaflet-touch-drag"]').then($el => {
      const scroll_in=$el[0];
      cy.get(scroll_in).scrollIntoView();
      
      });
      cy.get('a[class="leaflet-control-zoom-in"]').then($el => {
        const zoom_in=$el[0];
      cy.get(zoom_in).click({ force: true });
      cy.get(zoom_in).dblclick({ force: true });
      });
      cy.wait(2000);
      
    });
    it('Checks Map component for Geo search Location', () => {
    cy.viewport(1000, 1100);
    cy.wait(3000);
    cy.get('input[placeholder="Enter address"]').then($el => {
    const address_search=$el[0];
    cy.get(address_search).type('2260 sooke rd');
    });
    cy.wait(2000);
    cy.get('div').contains('2260 Sooke Rd, Colwood, BC').click();
      //Mark a point on searched address
    cy.get('a[title="Draw a marker"]').then($el => {
        const marker_elem=$el[0];
        cy.get(marker_elem).click({force: true});
    });       
    cy.get('a[title="No layers to delete"]').then($el => {
      const coords = $el[0].getBoundingClientRect();
      const layer_del_btn=$el[0];
      cy.get(layer_del_btn)
      .trigger('mousedown', { which: 1}, { force: true })
      .trigger('mousemove', coords.x, -30, { force: true })
      .trigger('mouseup', { force: true });
    });       
    cy.get('div[class="leaflet-marker-icon leaflet-mouse-marker leaflet-zoom-hide leaflet-interactive"]').click({ force: true });
    
    cy.wait(2000);
    //verify point is marked on the searched address region
    //cy.get('p').contains('(48.43406,-123.49410)').should('exist');
    cy.get('button').contains('Save').click();
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
      cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
      cy.waitForLoad();
      //
      //Delete form after test run
      cy.get(':nth-child(5) > .v-btn > .v-btn__content > .mdi-delete').click();
      cy.get('[data-test="continue-btn-continue"]').click();
      cy.get('#logoutButton > .v-btn__content > span').click();
  
    });
  });
});
