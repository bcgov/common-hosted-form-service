import * as L from "leaflet"
import "leaflet-draw"
import 'leaflet/dist/leaflet.css';
import "leaflet-draw/dist/leaflet.draw-src.css";

const DEFAULT_MAP_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const DEFAULT_LAYER_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

export default function MapService(options){
    if(options.mapContainer){
        const {map,drawnItems} = initializeMap(options)
        
        //event listener for drawn objects
        map.on('draw:created', function(e){
            //console.log(e)
            let type = e.type
            let layer = e.layer

            drawnItems.addLayer(layer)
            drawnItems.eachLayer((l) => {console.log(l)})

        })
    }
}
const initializeMap = (options) =>{
    const {mapContainer, center, drawOptions, form } = options;

    const map = L.map(mapContainer).setView(center, 13);
        L.tileLayer(DEFAULT_MAP_LAYER_URL, {
            attribution:DEFAULT_LAYER_ATTRIBUTION ,
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
            draw:drawOptions,
            edit:{
                featureGroup: drawnItems
            }
        })
        //Attach Controls to map
        map.addControl(drawControl)
        return {map,drawnItems}
}