/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.phoneNumber;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simplephonenumberadvanced';
const DISPLAY = 'Phone Number';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
            inputType: 'tel',
            inputFormat: 'plain',
            inputMask: '(999) 999-9999'
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'advanced',
            icon: 'phone-square',
            weight: 760,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
