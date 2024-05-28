import { Components } from 'formiojs';
const FieldComponent = Components.components.field;
import L from "leaflet"
import "leaflet-draw"
import 'leaflet/dist/leaflet.css';
import "leaflet-draw/dist/leaflet.draw-src.css";

const CENTER = [48.41938669910753, -123.37030649185182]

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
        <div id="mapContainer" style="height:400px;"></div>
        
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
        if(mapContainer){
            const map = L.map(mapContainer,{drawControl:true}).setView(CENTER, 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              }).addTo(map);
            var drawnItems = new L.FeatureGroup()
            var drawControl = new L.Control.Draw({
                edit:{
                    featureGroup: drawnItems
                }
            })
            map.addControl(drawControl)
            
            //event listener
            map.on('draw:created', function(e){
                console.log(e)
                var type = e.layerType
                var layer = e.layer

                drawnItems.addLayer(layer)
            })
        }
    }

}

const testComponent = (data) =>{
    const printData = (d) =>{ console.log(d)}
    console.log(data)
    printData(data)
}
Components.addComponent('map', MapComponent);
export default MapComponent;
