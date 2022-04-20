/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.textfield;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'postalcode';
const DISPLAY = 'Postal Code';

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
            input: true,
            validateOn: 'change',
            validate: {
              required: true,
              pattern: '^(?!.*[DFIOQU])[A-VXY][0-9][A-Z] ?[0-9][A-Z][0-9]$',
            },
            errors:{
              'required':'Postal code is required. Try again.',
              'pattern':'Please enter a valid postal code.'} 
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'simple',
            icon: 'terminal',
            weight: 80,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
