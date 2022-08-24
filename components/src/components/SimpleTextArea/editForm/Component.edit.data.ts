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
        weight: 200,
        type: 'radio',
        label: 'Text Case',
        key: 'case',
        tooltip: 'When data is entered, you can change the case of the value.',
        input: true,
        values: [
            {
                value: 'mixed',
                label: 'Mixed (Allow upper and lower case)'
            },
            {
                value: 'uppercase',
                label: 'Uppercase'
            },
            {
                value: 'lowercase',
                label: 'Lowercase'
            }
        ]
    }
];
