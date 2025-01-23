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
// Checks Map component functionalities
  it('Checks Map component for Polygon marker', () => {
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
      cy.get('textarea[placeholder="Add a tooltip beside the label"]').type('Add your desired location');
      cy.wait(2000);
      cy.get(':nth-child(2) > .nav-link').click();
      cy.wait(2000);
      cy.wait(2000);
      cy.get('input[value="circle"]').click();
      cy.get('input[value="polygon"]').click();
      cy.get('input[name="data[numPoints]"').type('{selectall}{backspace}');
      cy.get('input[name="data[numPoints]"').type('3');
      cy.wait(2000);
      cy.get('a[title="Draw a marker"]').then($el => {
        const marker_elem=$el[0];
        cy.get(marker_elem).click({force: true});
      });
        
      cy.get('a[title="No layers to delete"]').then($el => {
            const layer_del_btn=$el[0];
            cy.get(layer_del_btn)
            .trigger('mousedown', { which: 1}, { force: true })
        //.trigger('mousemove', coords.x, -30, { force: true })
          .trigger('mousemove', coords.y, +450, { force: true })
        .trigger('mouseup', { force: true });
      });
      cy.get('img[alt="Marker"]').click({ force: true });
      cy.wait(2000);
      cy.get('a.leaflet-draw-draw-polygon').then($el => {
        const draw_polygon=$el[0];
    
      cy.get(draw_polygon).click();
      });
      cy.get('div[class="leaflet-draw-tooltip leaflet-draw-tooltip-single"]').click();
      cy.get('div[class="leaflet-draw-tooltip leaflet-draw-tooltip-single"]').click();
      cy.get('div[class="leaflet-draw-tooltip leaflet-draw-tooltip-single"]').click();
      cy.get('div[class="leaflet-draw-tooltip leaflet-draw-tooltip-single"]').click();
      cy.get('a[title="No layers to delete"]').then($el => {
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
      cy.get('div[class="leaflet-marker-icon leaflet-mouse-marker leaflet-zoom-hide leaflet-interactive"]').click({ force: true });

      cy.get('a[title="Finish drawing"]').click({ force: true });
      cy.get('.leaflet-interactive').should('exist');
      cy.wait(2000);
      cy.get('g').find('path[stroke-linejoin="round"]').should('exist');
      
      });
      cy.waitForLoad();
      cy.get('button').contains('Save').click();
  });

  it('Checks form submission for a Map component', () => {
        cy.viewport(1000, 1100);
        cy.waitForLoad();
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
    //Form submission verification
      cy.visit(`/${depEnv}/form/submit?f=${arrayValues[0]}`);
      cy.wait(2000);
      cy.get('button').contains('Submit').should('be.visible');
       cy.wait(2000);
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
      });
      cy.get('a[title="Draw a marker"]').then($el => {
        const marker_elem=$el[0];
        cy.get(marker_elem).click({force: true});
      });  
      cy.get('div[class="leaflet-draw-tooltip leaflet-draw-tooltip-single"]').click({ force: true });
      
      cy.get('div[class="leaflet-popup-content"]').find('p').contains('Only 3 features per submission').should('be.visible');
      cy.get('button').contains('Submit').click();
      cy.wait(4000);
      cy.get('button').contains('Submit').click();
      cy.waitForLoad();
      cy.location('pathname').should('eq', `/${depEnv}/form/success`);
      cy.contains('h1', 'Your form has been submitted successfully');
      cy.wait(4000);
      cy.get('g').find('path[stroke-linejoin="round"]').should('exist');
      //Delete form after test run
      cy.visit(`/${depEnv}/form/manage?f=${arrayValues[0]}`);
      cy.waitForLoad();
      cy.get(':nth-child(5) > .v-btn > .v-btn__content > .mdi-delete').click();
      cy.get('[data-test="continue-btn-continue"]').click();
      cy.get('#logoutButton > .v-btn__content > span').click();
   
      });

  });

});

    
