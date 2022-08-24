/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.tabs;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simpletabs';
const DISPLAY = 'Tabs';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
            persistent: false,
            tableView: false,
            components: [
                {
                    label: 'Tab 1',
                    key: 'tab1',
                    components: [],
                },
            ],
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'simple',
            icon: 'folder-o',
            weight: 53,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
