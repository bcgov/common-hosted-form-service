/* tslint:disable */
import { Components } from 'formiojs';
const SelectComponent = (Components as any).components.select;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'orgbook';
export default class Component extends (SelectComponent as any) {
    static schema(...extend) {
        return SelectComponent.schema({
            type: ID,
            label: 'Registered Business Name',
            key: ID,
            idPath: 'id',
            dataSrc: 'url',
            data: {
                values: [],
                json: '',
                url: 'https://orgbook.gov.bc.ca/api/v3/search/autocomplete',
                resource: '',
                custom: ''
            },
            limit: 100,
            logic: [],
            filter: 'latest=true&inactive=false&revoked=false',
            dataType: 'string',
            template: '{{ item.value }}',
            placeholder: 'Start typing to search BC Registered Businesses database',
            searchField: 'q',
            selectValues: 'results',
            valueProperty: 'value',
            selectFields: '',
            searchThreshold: 3,
            minSearch: 3,
            hidden: false,
            prefix: '',
            suffix: '',
            unique: false,
            widget: '',
            dbIndex: false,
            overlay: {
                top: '',
                left: '',
                page: '',
                style: '',
                width: '',
                height: ''
            },
            tooltip: '',
            disabled: false,
            lazyLoad: true,
            multiple: false,
            redrawOn: '',
            tabindex: '',
            validate: {
                json: '',
                custom: '',
                select: false,
                unique: false,
                multiple: false,
                required: false,
                customMessage: '',
                customPrivate: false,
                strictDateValidation: false
            },
            autofocus: false,
            encrypted: false,
            hideLabel: false,
            indexeddb: {
                filter: {}
            },
            modalEdit: false,
            protected: false,
            refreshOn: '',
            tableView: false,
            attributes: {},
            errorLabel: '',
            persistent: true,
            properties: {},
            validateOn: '',
            clearOnHide: true,
            conditional: {
                eq: '',
                json: '',
                show: null,
                when: null
            },
            customClass: '',
            description: '',
            fuseOptions: {
                include: 'score',
                threshold: 0.3
            },
            authenticate: false,
            defaultValue: '',
            disableLimit: false,
            customOptions: {
                duplicateItemsAllowed: false
            },
            labelPosition: 'top',
            readOnlyValue: true,
            searchEnabled: true,
            showCharCount: false,
            showWordCount: false,
            uniqueOptions: false,
            calculateValue: '',
            clearOnRefresh: false,
            calculateServer: false,
            selectThreshold: 0.3,
            customConditional: '',
            allowMultipleMasks: false,
            customDefaultValue: '',
            allowCalculateOverride: false
        }, ...extend);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: 'Business Name Search',
            group: 'advanced',
            icon: 'database',
            weight: 70,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }
}
