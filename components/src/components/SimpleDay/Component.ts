/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.day;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simpleday';
const DISPLAY = 'Day';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
            fields: {
                day: {
                    type: 'number',
                    placeholder: '',
                    required: false
                },
                month: {
                    type: 'select',
                    placeholder: '',
                    required: false
                },
                year: {
                    type: 'number',
                    placeholder: '',
                    required: false
                }
            },
            dayFirst: false,
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'simple',
            icon: 'calendar',
            weight: 21,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
