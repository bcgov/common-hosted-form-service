/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.email;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simpleemail';
const DISPLAY = 'Email';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
            inputType: 'email'
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'simple',
            icon: 'at',
            weight: 12,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
