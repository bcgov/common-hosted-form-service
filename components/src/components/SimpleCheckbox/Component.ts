/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.checkbox;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simplecheckbox';
const DISPLAY = 'Checkbox';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
            inputType: 'checkbox',
            dataGridLabel: true,
            labelPosition: 'right',
            value: '',
            name: ''
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'simple',
            icon: 'check-square',
            weight: 4,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
