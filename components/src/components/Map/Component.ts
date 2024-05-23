/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.Field;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';


const ID = 'map';
const DISPLAY = 'Map';

export default class MapComponent extends (ParentComponent as any) {
    static schema(...extend) {
        return  MapComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
        }, ...extend);
    }

    public static editForm = editForm;
    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'simple',
            icon: 'map',
            weight: 1,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: MapComponent.schema()
        };
    }
    
}
