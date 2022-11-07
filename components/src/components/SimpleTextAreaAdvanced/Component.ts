/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.textarea;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simpletextareaadvanced';
const DISPLAY = 'Text Area';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
            rows: 3,
            wysiwyg: false,
            editor: '',
            spellcheck: true,
            fixedSize: true,
            inputFormat: 'plain',
            validate: {
                minWords: '',
                maxWords: ''
            }
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'advanced',
            icon: 'font',
            weight: 730,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
