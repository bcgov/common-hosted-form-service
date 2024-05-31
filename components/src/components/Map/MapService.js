import L from "leaflet"
import "leaflet-draw"
import 'leaflet/dist/leaflet.css';
import "leaflet-draw/dist/leaflet.draw-src.css";

export default function MapService(options){
    const {mapContainer, center, drawOptions, form } = options;
    if(mapContainer){
        const map = L.map(mapContainer).setView(center, 13);
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
            draw:drawOptions,
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