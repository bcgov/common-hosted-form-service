/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.radio;
import editForm from './Component.form';

const ID = 'simpleradios';
const DISPLAY = 'Radio Group';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
            inline: false,
            values: [{ label: '', value: '' }],
            fieldSet: false
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'simple',
            icon: 'dot-circle-o',
            weight: 2,
            documentation: 'https://en.wikipedia.org/wiki/Special:Random',
            schema: Component.schema()
        };
    }
}
