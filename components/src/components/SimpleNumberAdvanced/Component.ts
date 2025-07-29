/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.number;
import editForm from './Component.form';
import { addRoundingToSchema, RoundingMixin } from '../Common/Rounding.mixin';

import { Constants } from '../Common/Constants';

const ID = 'simplenumberadvanced';
const DISPLAY = 'Number';

export default class Component extends (ParentComponent as any) {
    constructor(component, options, data) {
        super(component, options, data);
        
        // Apply rounding mixin
        Object.assign(this, RoundingMixin);
    }

    static schema(...extend) {
        const baseSchema = ParentComponent.schema({
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

        return addRoundingToSchema(baseSchema);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'advanced',
            icon: 'hashtag',
            weight: 750,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema(),
        };
    }
}
