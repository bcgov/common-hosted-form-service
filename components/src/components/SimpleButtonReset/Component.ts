/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.button;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simplebtnreset';
const DISPLAY = 'Reset Button';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: 'Reset',
            key: 'submit',
            size: 'md',
            leftIcon: '',
            rightIcon: '',
            block: false,
            action: 'reset',
            persistent: false,
            disableOnInvalid: false,
            theme: 'secondary',
            dataGridLabel: true
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'simple',
            icon: 'undo',
            weight: 31,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
