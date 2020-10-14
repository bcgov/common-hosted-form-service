/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.panel;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simplepanel';
const DISPLAY = 'Panel';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
            title: 'Panel',
            theme: 'default',
            breadcrumb: 'default',
            components: [],
            clearOnHide: false,
            input: false,
            tableView: false,
            persistent: false,
            collapsible: false,
            collapsed: false
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'simple',
            icon: 'list-alt',
            weight: 54,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
