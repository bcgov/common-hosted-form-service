/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.textarea;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simpletextarea';
const DISPLAY = 'Multi-line Text';

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

    // @formio/vue stores the Form.io instance in ref(), causing Vue's reactive Proxy to
    // wrap CKEditor's internal Observable Proxy. CKEditor's Proxy marks _events as
    // non-configurable; Vue's outer Proxy returns a reactive (different) object for it,
    // violating the Proxy invariant and throwing a TypeError on edit and unmount.
    // Overriding addCKE (called by the parent's attachElement) sets __v_skip = true
    // before the editor is stored in this.editors[], so Vue never creates a cached
    // reactive proxy for it. Using attachElement.then() is too late — Vue's scheduler
    // can access editors[] between the two microtasks and cache a reactive proxy first.
    addCKE(element: any, settings: any, onChange: any) {
        return (super.addCKE as any)(element, settings, onChange).then((editor: any) => {
            if (editor) editor.__v_skip = true;
            return editor;
        });
    }

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'simple',
            icon: 'font',
            weight: 2,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
