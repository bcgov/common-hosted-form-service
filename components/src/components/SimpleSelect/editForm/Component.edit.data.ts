import common from '../../Common/Simple.edit.data';
export default [
    ...common,
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
