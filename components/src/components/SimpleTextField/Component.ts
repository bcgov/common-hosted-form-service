/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.textfield;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simpletextfield';
const DISPLAY = 'Text Field';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
            mask: false,
            inputType: 'text',
            inputFormat: 'plain',
            inputMask: '',
            tableView: false,
            spellcheck: true,
            widget: {
                type: 'input'
            },
            validate: {
                minLength: '',
                maxLength: '',
                pattern: ''
            }
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'simple',
            icon: 'terminal',
            weight: 1,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
