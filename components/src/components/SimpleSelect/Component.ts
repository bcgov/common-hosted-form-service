/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.select;
import editForm from './Component.form';

const ID = 'simpleselect';
const DISPLAY = 'Select';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {
        return ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
            dataSrc: 'values',
            dataType: 'auto',
            widget: 'choicesjs',
            idPath: 'id',
            data: {
                values: [],
                json: '',
                url: '',
                resource: '',
                custom: ''
            },
            clearOnRefresh: false,
            limit: 100,
            valueProperty: '',
            lazyLoad: true,
            filter: '',
            searchEnabled: true,
            searchField: '',
            minSearch: 0,
            readOnlyValue: false,
            authenticate: false,
            template: '<span>{{ item.label }}</span>',
            selectFields: '',
            searchThreshold: 0.3,
            uniqueOptions: false,
            tableView: true,
            fuseOptions: {
                include: 'score',
                threshold: 0.3,
            },
            customOptions: {}
    }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'simple',
            icon: 'list',
            weight: 2,
            documentation: 'https://en.wikipedia.org/wiki/Special:Random',
            schema: Component.schema()
        };
    }
}
