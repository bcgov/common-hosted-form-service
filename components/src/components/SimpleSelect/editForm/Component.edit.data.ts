export default [
    {
        weight: 0,
        type: 'checkbox',
        label: 'Multiple Values',
        tooltip: 'Allows multiple values to be entered for this field.',
        key: 'multiple',
        input: true
    },
    {
        type: 'textfield',
        label: 'Default Value',
        key: 'defaultValue',
        weight: 5,
        placeholder: 'Default Value',
        tooltip: 'The will be the value for this field, before user interaction. Having a default value will override the placeholder text.',
        input: true
    },
    {
        type: 'datagrid',
        input: true,
        label: 'Select List Items',
        key: 'data.values',
        tooltip: 'Values to use in the list. Labels are shown in the select field. Values are the corresponding values saved with the submission.',
        weight: 10,
        reorder: true,
        defaultValue: [{ label: '', value: '' }],
        components: [
            {
                label: 'Label',
                key: 'label',
                input: true,
                type: 'textfield',
            },
            {
                label: 'Value',
                key: 'value',
                input: true,
                type: 'textfield',
                allowCalculateOverride: true,
                calculateValue: { _camelCase: [{ var: 'row.label' }] },
            },
        ],
    }
];
