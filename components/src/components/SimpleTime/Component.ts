/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.time;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simpletime';
const DISPLAY = 'Time';

const defaultDataFormat = 'HH:mm:ss';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
            inputType: 'time',
            format: 'HH:mm',
            dataFormat: defaultDataFormat,
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'simple',
            icon: 'clock-o',
            weight: 22,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
