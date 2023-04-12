/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.url;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simpleurladvanced';
const DISPLAY = 'Url';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
            inputType: 'url'
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'advanced',
            icon: 'link',
            weight: 740,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
