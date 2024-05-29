import { Formio, Components } from 'formiojs';
const FieldComponent = Components.components.field;
import L from "leaflet"
import "leaflet-draw"
import 'leaflet/dist/leaflet.css';
import "leaflet-draw/dist/leaflet.draw-src.css";

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
        if(mapContainer){
            const map = L.map(mapContainer).setView(CENTER, 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                }).addTo(map);
            


            if(form && form[0]?.classList.contains("formbuilder")){
                map.dragging.disable();    
                map.scrollWheelZoom.disable();
            }

            //Initialize Draw Layer
            let drawnItems = new L.FeatureGroup()
            map.addLayer(drawnItems)
            //Add Drawing Controllers
            let drawControl = new L.Control.Draw({
                draw:{
                    circlemarker:false,
                    polygon: false,
                    polyline: false,
                    rectangle:false,
                },
                edit:{
                    featureGroup: drawnItems
                }
            })
            //Attach Controls to map
            map.addControl(drawControl)
            
            //event listener for drawn objects
            map.on('draw:created', function(e){
                //console.log(e)
                let type = e.layerType
                let layer = e.layer

                drawnItems.addLayer(layer)
                console.log(drawnItems._layers)

            })
        }
    }

}

Components.addComponent('map', MapComponent);
export default MapComponent;
