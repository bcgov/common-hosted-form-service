/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.number;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simplenumberadvanced';
const DISPLAY = 'Number';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
            validate: {
                min: '',
                max: '',
                step: 'any',
                integer: ''
            }
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'advanced',
            icon: 'hashtag',
            weight: 750,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
