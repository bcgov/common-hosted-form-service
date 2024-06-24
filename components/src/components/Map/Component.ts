import { Components } from 'formiojs';
const FieldComponent = (Components as any).components.field;
import MapService from './services/MapService';
import baseEditForm from './Component.form';
import { marker, rectangle } from 'leaflet';

const CENTER = [48.41939025932759,-123.37029576301576]

export default class Component extends (FieldComponent as any) {
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
            schema: Component.schema(),
        };
    }
    static editForm = baseEditForm;
    
    componentID = super.elementInfo().component.id
    render() {
        return super.render(        
        `
        <div id="map-${this.componentID}" style="height:400px; z-index:1;"></div>
        
        `
        )
    }
    attach(element) {
        const superAttach = super.attach(element);
        this.loadMap();
        return superAttach
    }
    loadMap() {
        const mapContainer = document.getElementById(`map-${this.componentID}`);
        const form = document.getElementsByClassName("formio")
        let drawOptions = {
            marker:false,
            circlemarker:false,
            polygon: false,
            polyline: false,
            circle: false,
            rectangle:null
        }
        if(this.component.markerType == "rectangle"){
            drawOptions.rectangle = {showArea:false}//fixes a bug in Leaflet.Draw 
        }else{
            drawOptions.rectangle = false
            drawOptions[this.component.markerType] = true;//set marker type from user choice
        }
        const {numPoints, defaultZoom} = this.component;
        MapService({mapContainer, drawOptions, center:CENTER, form, numPoints})

    }

}

export {};
