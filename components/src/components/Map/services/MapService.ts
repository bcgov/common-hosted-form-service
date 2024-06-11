import * as L from "leaflet"
import "leaflet-draw"
import 'leaflet/dist/leaflet.css';
import "leaflet-draw/dist/leaflet.draw-src.css";

const DEFAULT_MAP_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const DEFAULT_LAYER_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const DECIMALS_LATLNG = 5//the number of decimals of latitude and longitude to be displayed in the marker popup 

export default function MapService(options){
    if(options.mapContainer){
        const {map,drawnItems} = initializeMap(options)
        
        //event listener for drawn objects
        map.on('draw:created', function (e) {
            //console.log(e)
            let marker = e.layer;
            if(drawnItems.getLayers().length){
                console.log(drawnItems.getLayers())
                console.log("too many markers")
                L.popup().setLatLng(marker._latlng).setContent("<p>Only one marker for submission</p>").openOn(map)

            }else{
                drawnItems.addLayer(marker);
            }
            marker.bindPopup(`<p>(${marker._latlng.lat.toFixed(5)},${marker._latlng.lng.toFixed(5)})</p>`).openPopup();
            //drawnItems.eachLayer((l) => { console.log(l); });
        });
    }
}
const initializeMap = (options) =>{
    const {mapContainer, center, drawOptions, form } = options;

    const map = L.map(mapContainer).setView(center, 13);
        L.tileLayer(DEFAULT_MAP_LAYER_URL, {
            attribution:DEFAULT_LAYER_ATTRIBUTION ,
            }).addTo(map);
        




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

        if(form && form[0]?.classList.contains("formbuilder")){
            map.dragging.disable();    
            map.scrollWheelZoom.disable();
        }

        //Attach Controls to map
        map.addControl(drawControl)
        return {map,drawnItems}
}