import { Components } from 'formiojs';
//import SMK from '@bcgov/smk';

const FieldComponent = Components.components.field;

class MapComponent extends FieldComponent {
  static schema(...extend: any[]) {
    return FieldComponent.schema({
      type: 'map',
      label: 'Map',
      key: 'map',
      input: true,
      ...extend,
    });
  }

  static get builderInfo() {
    return {
      title: 'Map',
      group: 'basic',
      icon: 'map',
      weight: 70,
      schema: MapComponent.schema(),
    };
  }

  render() {
    return super.render(
      this.renderTemplate('input', {
        input: `<div id="map" style="width: 100%; height: 400px;">map goes here</div>`,
      })
    );
  }

  attach(element: HTMLElement) {
    super.attach(element);
    this.loadMap();
  }

  loadMap() {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      console.log('inside Map');
      //   SMK.init({ container: 'map' }).then((smk) => {
      //     // Additional SMK configuration goes here
      //   });
    }
  }
}

Components.addComponent('map', MapComponent);
export default MapComponent;
