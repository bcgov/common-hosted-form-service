/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.htmlelement;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simpleparagraph';
const DISPLAY = 'Paragraph';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
            tag: 'p',
            attrs: [],
            content: '',
            input: false,
            persistent: false
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'simple',
            icon: 'paragraph',
            weight: 42,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
