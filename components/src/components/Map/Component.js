import { Components } from 'formiojs';
const FieldComponent = Components.components.field;

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
        <div>
            <script>
                SMK.INIT( {
                    containerSel: '#smk-map-frame'
                } )
            </script>
        </div>
        
        `
        )
    }
    attach(element) {
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

const testComponent = (data) =>{
    const printData = (d) =>{ console.log(d)}
    console.log(data)
    printData(data)
}
Components.addComponent('map', MapComponent);
export default MapComponent;
