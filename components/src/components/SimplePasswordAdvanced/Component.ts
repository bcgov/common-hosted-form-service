/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.password;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simplepasswordadvanced';
const DISPLAY = 'Password';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
            inputType: 'password',
            protected: true,
            tableView: false
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'advanced',
            icon: 'asterisk',
            weight: 775,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
