/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.button;
import editForm from './Component.form';

const ID = 'simplebtnsubmit';
const DISPLAY = 'Submit Button';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: 'Submit',
            key: ID,
            size: 'md',
            leftIcon: '',
            rightIcon: '',
            block: false,
            action: 'submit',
            persistent: false,
            disableOnInvalid: false,
            theme: 'primary',
            dataGridLabel: true
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'simple',
            icon: 'paper-plane',
            weight: 30,
            documentation: 'https://en.wikipedia.org/wiki/Special:Random',
            schema: Component.schema()
        };
    }
}
