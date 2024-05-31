import { Components } from 'formiojs';
const FieldComponent = Components.components.field;
import MapService from './MapService';

const CENTER = [48.41939025932759,-123.37029576301576]

class MapComponent extends FieldComponent {
    static schema(...extend) {
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
        `
        <div id="mapContainer" style="height:400px; z-index:1;"></div>
        
        `
        )
    }
    attach(element) {
        const superAttach = super.attach(element);
        this.loadMap();
        return superAttach
    }
    loadMap() {
        const mapContainer = document.getElementById("mapContainer");
        const form = document.getElementsByClassName("formio")
        const drawOptions = {
            circlemarker:false,
            polygon: false,
            polyline: false,
            rectangle:false
        }
        MapService({mapContainer, drawOptions, center:CENTER, form})

    }

}

Components.addComponent('map', MapComponent);
export default MapComponent;
