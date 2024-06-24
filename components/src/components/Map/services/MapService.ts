import * as L from "leaflet"
import "leaflet-draw"
import 'leaflet/dist/leaflet.css';
import "leaflet-draw/dist/leaflet.draw-src.css";

const DEFAULT_MAP_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const DEFAULT_LAYER_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const DEFAULT_MAP_ZOOM = 13;
const DECIMALS_LATLNG = 5//the number of decimals of latitude and longitude to be displayed in the marker popup 
const SET_MAX_MARKERS = 1;

export default function MapService(options){
    if(options.mapContainer){
        const {map,drawnItems} = initializeMap(options)
        map.invalidateSize();


        //event listener for drawn objects
        map.on('draw:created', function (e) {
            let marker = e.layer;
            if(drawnItems.getLayers().length === options.numPoints && e?.type === "marker"){
                console.log(drawnItems.getLayers())
                console.log("too many markers")
                L.popup().setLatLng(marker._latlng).setContent("<p>Only one marker for submission</p>").openOn(map)

            }else{
                drawnItems.addLayer(marker);
            }
            marker.bindPopup(`
                <p>(${marker._latlng.lat.toFixed(DECIMALS_LATLNG)},${marker._latlng.lng.toFixed(DECIMALS_LATLNG)})</p>`
                ).openPopup();
            //drawnItems.eachLayer((l) => { console.log(l); });
        });
    }
}
const initializeMap = (options) =>{
    let {mapContainer, center, drawOptions, form, defaultZoom } = options;
    if(drawOptions.rectangle){
        drawOptions.rectangle.showArea = false;
    }
    const map = L.map(mapContainer).setView(center, defaultZoom );
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