/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.number;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simplenumber';
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
            group: 'simple',
            icon: 'hashtag',
            weight: 10,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
