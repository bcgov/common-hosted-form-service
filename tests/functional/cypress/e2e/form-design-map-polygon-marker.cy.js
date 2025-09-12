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
      cy.wait(1000);
      cy.get('textarea[placeholder="Add a tooltip beside the label"]').type('Add your desired location');
      cy.wait(1000);
      cy.get(':nth-child(2) > .nav-link').click();
      cy.wait(2000);
      cy.get('input[value="circle"]').click();
      cy.get('input[value="polygon"]').click();
      cy.get('input[name="data[numPoints]"').type('{selectall}{backspace}');
      cy.get('input[name="data[numPoints]"').type('3');
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
      cy.wait(1000);
  });
  it('Checks user location feature for a Map component', () => {
    cy.viewport(1000, 1100);
    cy.waitForLoad();
    cy.get('div[title="Click to center the map on your location"]').should('exist');
    cy.get('i[class="fa fa-location-arrow"]').then($el => {
      const location_btn=$el[0];
      cy.get(location_btn).click();
    });
    cy.wait(2000);
    //verify local street map is loaded
    cy.get('img[class="leaflet-tile leaflet-tile-loaded"]').should('exist');
    cy.get('img[class="leaflet-tile leaflet-tile-loaded"]').should('have.attr', 'src').and('include', 'https://c.tile.openstreetmap.org');
    //Mark a point on the current location
    cy.get('a[title="Draw a marker"]').then($el => {
      const marker_elem=$el[0];
      cy.get(marker_elem).click({force: true});
    });
    cy.get('div[class="leaflet-marker-icon leaflet-mouse-marker leaflet-zoom-hide leaflet-interactive"]').click({ force: true });
    cy.wait(2000);
  });
  //validate custom base map layers
  it('Validate custom base map layers for  Map component', () => {
        cy.viewport(1000, 1100);
        cy.waitForLoad();
        cy.wait(2000);
        cy.get('tfoot > tr > td > .btn').click();
        cy.get('input[name="data[availableBaseLayersCustom][0][label]"]').click();
        cy.get('input[name="data[availableBaseLayersCustom][0][label]"]').type('test');
        cy.get('input[name="data[availableBaseLayersCustom][0][url]"]').click();
        const customUrl = 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png';
        cy.get('input[name="data[availableBaseLayersCustom][0][url]"]').type(customUrl,{ parseSpecialCharSequences: false });
        cy.get('input[name="data[availableBaseLayersCustom][0][attribution]"]').click();
        cy.get('input[name="data[availableBaseLayersCustom][0][attribution]"]').type('&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors');
        cy.get('input[name="data[availableBaseLayersCustom][0][enabled]"]').click();
  });
  it('Checks base map layers for a Map component', () => {
      cy.viewport(1000, 1100);
      cy.waitForLoad();
      cy.get('input[name="data[allowBaseLayerSwitch]"').click();
      cy.get('input[value="OpenStreetMap"]').should('be.checked');
      cy.get('input[value="Light"]').should('be.checked');
      cy.get('input[value="Dark"]').should('be.checked');
      cy.get('input[value="Topographic"]').should('be.checked');
      cy.wait(2000);
      cy.get('a[class="leaflet-control-layers-toggle"').then($el => {
        const base_map_btn=$el[0];
        cy.get(base_map_btn).trigger('mouseover');
      });
        cy.contains('span', 'OpenStreetMap')     // Find the span with the text
        .prev('input[type="radio"]')           // Get the radio input just before it
        .should('be.checked');                 // Assert that it's checked
      cy.contains('span', ' Light').prev('input[type="radio"]')         
          .should('not.have.attr', 'checked');  
      cy.contains('span', ' Dark').prev('input[type="radio"]')          
          .should('not.have.attr', 'checked');  
      cy.contains('span', ' Topographic').prev('input[type="radio"]')
          .should('not.have.attr', 'checked'); 
          cy.wait(2000);
      cy.get('a[title="Draw a marker"]').then($el => {
        const marker_elem=$el[0];
        cy.get(marker_elem).click({force: true});
      }); 
      cy.get('a[title="Cancel drawing"').click();   
      //validate visiility of different layers
      cy.get('a[class="leaflet-control-layers-toggle"').then($el => {
        const base_map_btn=$el[0];
        cy.get(base_map_btn).trigger('mouseover',{force: true});
      
        cy.get('input[class="leaflet-control-layers-selector"]')
        .then($el => {
        const base_select_light=$el[1];
        const base_select_dark=$el[2];
        const base_select_topographic=$el[3];
        const base_select_test_custom=$el[4];
        cy.get(base_select_dark).closest('span').contains(' Dark').click({ force: true });
        cy.get(base_select_dark).check();
        cy.wait(2000);
        cy.get('img[src*="https://b.basemaps.cartocdn.com/dark_all/"]').should('be.visible');
        cy.get(base_select_light).closest('span').contains(' Light').click({ force: true });
        cy.wait(1000);
        cy.get(base_select_light).check();
        cy.wait(2000);
        cy.get('img[src*="https://b.basemaps.cartocdn.com/light_all/"]').should('be.visible');
        cy.get(base_map_btn).trigger('mouseover',{force: true});
        cy.get(base_select_topographic).closest('span').contains(' Topographic').click({ force: true });
        cy.waitForLoad();
        cy.get(base_select_topographic).check();
        cy.wait(3000);
        cy.get('img[src*="https://b.tile.opentopomap.org/"]').should('be.visible');
        cy.wait(2000);
        cy.get(base_select_test_custom).check();
        cy.wait(2000);
        cy.get(base_select_test_custom).closest('span').contains('test').should('exist');
        });
      });
      cy.waitForLoad();   
      cy.get('.btn-success').click();  
  });
  it('Checks form submission for a Map component', () => {
        cy.viewport(1000, 1100);
        cy.waitForLoad();
        cy.wait(2000);
  // Form saving
      let savedButton = cy.get('[data-cy=saveButton]');
      expect(savedButton).to.not.be.null;
      savedButton.trigger('click');
      cy.wait(3000); 
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
      //validate different basic layers existence on submitter view
      cy.get('a[class="leaflet-control-layers-toggle"').then($el => {
        const base_map_btn=$el[0];
        cy.get(base_map_btn).trigger('mouseover',{force: true});
      
        cy.get('input[class="leaflet-control-layers-selector"]')
        .then($el => {
        const base_select_light=$el[1];
        const base_select_dark=$el[2];
        const base_select_topographic=$el[3];
        cy.get(base_select_dark).closest('span').contains(' Dark').click({ force: true });
        cy.get(base_select_dark).check();
        cy.wait(2000);
        cy.get('img[src*="https://b.basemaps.cartocdn.com/dark_all/"]').should('be.visible');
        cy.get(base_select_light).closest('span').contains(' Light').click({ force: true });
        cy.wait(1000);
        cy.get(base_select_light).check();
        cy.wait(2000);
        cy.get('img[src*="https://b.basemaps.cartocdn.com/light_all/"]').should('be.visible');
        cy.get(base_map_btn).trigger('mouseover',{force: true});
        cy.get(base_select_topographic).closest('span').contains(' Topographic').click({ force: true });
        cy.waitForLoad();
        cy.get(base_select_topographic).check();
        cy.wait(2000);
        cy.get('img[src*="https://b.tile.opentopomap.org/"]').should('be.visible');
        });
      });
      cy.waitForLoad();
      cy.get('a[title="Draw a marker"]').then($el => {
        const marker_elem=$el[0];
        cy.get(marker_elem).click({force: true});
      });  
      cy.get('div[class="leaflet-draw-tooltip leaflet-draw-tooltip-single"]').click({ force: true });
      cy.wait(2000);
      //Verify marker limit validation message
      cy.get('div[class="leaflet-popup-content"]').find('p').contains('Only 3 features per submission').should('be.visible');

      //Validate the feature of deleting existing markers not possible
      cy.get('.leaflet-draw-edit-remove').click();
      cy.get('g').find('path[stroke-linejoin="round"]').then($el => {
        const del_polygon=$el[0];
        cy.get(del_polygon).click({force: true});
      });  
      cy.get(':nth-child(2) > .leaflet-draw-actions > :nth-child(1) > a').click();
      //verify validation message
      cy.get('div[class="leaflet-popup-content"]').find('p').contains('Please do not delete pre-existing features').should('be.visible');
      //Delete the circle drawn by the submitter
      cy.get('.leaflet-draw-edit-remove').click();
      cy.get('g').find('path[stroke-linejoin="round"]').then($el => {
        const del_polygon=$el[1];
        cy.get(del_polygon).click({force: true});
      });
      //validate submitter is able to delete the marker drawn and save it
      cy.get(':nth-child(2) > .leaflet-draw-actions > :nth-child(1) > a').click();
      cy.get('button').contains('Submit').click();
      cy.wait(2000);
      cy.get('button').contains('Submit').click();
      cy.waitForLoad();
      cy.location('pathname').should('eq', `/${depEnv}/form/success`);
      cy.contains('h1', 'Your form has been submitted successfully');
      cy.wait(2000);
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