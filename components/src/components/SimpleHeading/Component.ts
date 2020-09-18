/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.htmlelement;
import editForm from './Component.form';

const ID = 'simpleheading';
const DISPLAY = 'Heading';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
            tag: 'h1',
            headingSize: 'h1',
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
            icon: 'header',
            weight: 1,
            documentation: 'https://en.wikipedia.org/wiki/Special:Random',
            schema: Component.schema()
        };
    }
}
