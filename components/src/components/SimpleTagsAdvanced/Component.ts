/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.tags;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simpletagsadvanced';
const DISPLAY = 'Tags';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
            delimeter: ',',
            storeas: 'string',
            maxTags: 0
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'advanced',
            icon: 'tags',
            weight: 765,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
