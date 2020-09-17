/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.htmlelement;
import editForm from './SimpleHeading.form';

export default class OrgBook extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: 'simpleheading',
            label: 'Heading',
            key: 'simpleheading',
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
            title: 'Heading',
            group: 'simple',
            icon: 'code',
            weight: 70,
            documentation: 'http://help.form.io/userguide/#html-element-component',
            schema: OrgBook.schema()
        };
    }
}
