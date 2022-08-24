/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.button;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simplebtnsubmit';
const DISPLAY = 'Submit Button';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: 'Submit',
            key: 'submit',
            size: 'md',
            leftIcon: '',
            rightIcon: '',
            block: false,
            action: 'submit',
            persistent: false,
            disableOnInvalid: true,
            theme: 'primary',
            dataGridLabel: true
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'simple',
            icon: 'paper-plane',
            weight: 30,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
