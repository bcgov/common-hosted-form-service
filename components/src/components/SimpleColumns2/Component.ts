/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.columns;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simplecols2';
const DISPLAY = 'Columns - 2';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
            columns: [
                { components: [], width: 6, offset: 0, push: 0, pull: 0, size: 'md' },
                { components: [], width: 6, offset: 0, push: 0, pull: 0, size: 'md' }
            ],
            clearOnHide: false,
            input: false,
            tableView: false,
            persistent: false,
            autoAdjust: false,
            hideOnChildrenHidden: false
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'simple',
            icon: 'columns',
            weight: 50,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
