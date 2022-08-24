export default [
    {
        type: 'textfield',
        input: true,
        key: 'data.url',
        weight: 10,
        label: 'Org. Book URL',
        placeholder: 'Org. Book URL',
        tooltip: 'Org. Book URL that returns a JSON to use as the data source.',
    },
    {
        type: 'checkbox',
        input: true,
        label: 'Lazy Load Data',
        key: 'lazyLoad',
        tooltip: 'When set, this will not fire off the request to the URL until this control is within focus. This can improve performance if you have many Select dropdowns on your form where the API\'s will only fire when the control is activated.',
        weight: 11,
    },
    {
        type: 'textfield',
        input: true,
        label: 'Data Path',
        key: 'selectValues',
        weight: 12,
        description: 'The object path to the iterable items.',
        tooltip: 'The property within the source data, where iterable items reside. For example: results',
    },
    {
        type: 'select',
        input: true,
        label: 'Storage Type',
        key: 'dataType',
        clearOnHide: true,
        tooltip: 'The type to store the data. String will store the Business Name, Object will store the object.',
        weight: 12,
        template: '<span>{{ item.label }}</span>',
        dataSrc: 'values',
        data: {
            values: [
                { label: 'String', value: 'string' },
                { label: 'Object', value: 'object' },
            ],
        },
        onChange(context) {
            if (context && context.flags && context.flags.modified) {
                const dataTypeProp = context.instance.data.dataType;
                const valueProp = dataTypeProp === 'object' ? '' : 'names[0].text';
                context.instance.root.getComponent('valueProperty').setValue(valueProp);
            }
        },
    },
    {
        type: 'textfield',
        input: true,
        key: 'idPath',
        weight: 12,
        label: 'ID Path',
        placeholder: 'id',
        tooltip: 'Path to the select option id.'
    },
    {
        type: 'textfield',
        input: true,
        label: 'Value Property',
        key: 'valueProperty',
        skipMerge: true,
        clearOnHide: false,
        weight: 13,
        description: "The selected item's property to save.",
        tooltip: 'The property of each item in the data source to use as the select value. If not specified, the item itself will be used.',
    },
    {
        type: 'textfield',
        input: true,
        key: 'searchField',
        label: 'Search Query Name',
        weight: 16,
        description: 'Name of URL query parameter (for Org Book, it is \'q\')',
        tooltip: 'The name of the search querystring parameter used when sending a request to filter results with. The server at the URL must handle this query parameter.',
    },
    {
        type: 'number',
        input: true,
        key: 'minSearch',
        weight: 17,
        label: 'Minimum Search Length',
        tooltip: 'The minimum amount of characters they must type before a search is made.',
        defaultValue: 3,
    },
    {
        type: 'textfield',
        input: true,
        key: 'filter',
        label: 'Filter Query',
        weight: 18,
        description: 'The filter query for results.',
        tooltip: 'Use this to provide additional filtering using query parameters.',
    },
    {
        type: 'number',
        input: true,
        key: 'limit',
        label: 'Limit',
        weight: 18,
        defaultValue: 100,
        description: 'Maximum number of items to view per page of results.',
        tooltip: 'Use this to limit the number of items to request or view.',
    },
    {
        type: 'textarea',
        input: true,
        key: 'template',
        label: 'Item Template',
        editor: 'ace',
        as: 'html',
        rows: 3,
        weight: 18,
        tooltip: 'The HTML template for the result data items.',
        allowCalculateOverride: true,
        calculateValue:(context) => {
            if (!context.data.template) {
                if (context.instance && context.instance._currentForm.options.editComponent) {
                    return context.instance._currentForm.options.editComponent.template;
                }
            }

            return context.data.template;
        }
    },
    {
        type: 'checkbox',
        input: true,
        weight: 21,
        key: 'searchEnabled',
        label: 'Enable Static Search',
        defaultValue: true,
        tooltip: 'When checked, the select dropdown will allow for searching within the static list of items provided.',
    },
    {
        label: 'Search Threshold',
        mask: false,
        tableView: true,
        alwaysEnabled: false,
        type: 'number',
        input: true,
        key: 'selectThreshold',
        validate: {
            min: 0,
            customMessage: '',
            json: '',
            max: 1,
        },
        delimiter: false,
        requireDecimal: false,
        encrypted: false,
        defaultValue: 0.3,
        weight: 22,
        tooltip: 'At what point does the match algorithm give up. A threshold of 0.0 requires a perfect match, a threshold of 1.0 would match anything.',
    },
    {
        type: 'checkbox',
        input: true,
        weight: 27,
        key: 'readOnlyValue',
        label: 'Read Only Value',
        tooltip: 'Check this if you would like to show just the value when in Read Only mode.',
    },
];
