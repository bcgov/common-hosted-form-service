export default [
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
        type: 'checkbox',
        input: true,
        weight: 70,
        key: 'delimiter',
        label: 'Use Thousands Separator',
        tooltip: 'Separate thousands by local delimiter.'
    },
    {
        type: 'number',
        input: true,
        weight: 80,
        key: 'decimalLimit',
        label: 'Decimal Places',
        tooltip: 'The maximum number of decimal places.'
    },
    {
        type: 'checkbox',
        input: true,
        weight: 90,
        key: 'requireDecimal',
        label: 'Require Decimal',
        tooltip: 'Always show decimals, even if trailing zeros.'
    },
];
