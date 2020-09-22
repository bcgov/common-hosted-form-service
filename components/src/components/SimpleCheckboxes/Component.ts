/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.selectboxes;
import editForm from './Component.form';

const ID = 'simplecheckboxes';
const DISPLAY = 'Checkbox Group';

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
            icon: 'plus-square',
            weight: 2,
            documentation: 'https://en.wikipedia.org/wiki/Special:Random',
            schema: Component.schema()
        };
    }
}
