/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.survey;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simplesurveyadvanced';
const DISPLAY = 'Survey';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'advanced',
            icon: 'list',
            weight: 850,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
