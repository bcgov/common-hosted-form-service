/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.fieldset;
import editForm from './Component.form';

const ID = 'simplefieldset';
const DISPLAY = 'Field Set';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
            legend: '',
            components: [],
            input: false,
            persistent: false
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'simple',
            icon: 'th-large',
            weight: 55,
            documentation: 'https://en.wikipedia.org/wiki/Special:Random',
            schema: Component.schema()
        };
    }
}
