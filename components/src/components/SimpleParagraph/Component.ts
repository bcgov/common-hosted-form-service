/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.htmlelement;
import editForm from './Component.form';

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
            weight: 2,
            documentation: 'https://en.wikipedia.org/wiki/Special:Random',
            schema: Component.schema()
        };
    }
}
