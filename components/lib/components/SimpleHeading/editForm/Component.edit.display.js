export default [
    {
        key: 'label',
        ignore: true,
    },
    {
        key: 'labelPosition',
        ignore: true
    },
    {
        key: 'placeholder',
        ignore: true
    },
    {
        key: 'description',
        ignore: true
    },
    {
        key: 'tooltip',
        ignore: true
    },
    {
        key: 'hideLabel',
        ignore: true
    },
    {
        key: 'autofocus',
        ignore: true
    },
    {
        key: 'disabled',
        ignore: true
    },
    {
        key: 'tabindex',
        ignore: true
    },
    {
        key: 'tableView',
        ignore: true
    },
    {
        key: 'hidden',
        ignore: true
    },
    {
        key: 'modalEdit',
        ignore: true
    },
    {
        key: 'refreshOnChange',
        ignore: true
    },
    {
        key: 'className',
        ignore: 'true',
    },
    {
        key: 'attrs',
        ignore: true
    },
    {
        type: 'radio',
        input: true,
        label: 'Heading Size',
        key: 'tag',
        clearOnHide: true,
        tooltip: 'The size of the heading font.',
        weight: 70,
        inline: true,
        defaultValue: 'h1',
        values: [
            { label: 'Largest', value: 'h1' },
            { label: 'Larger', value: 'h2' },
            { label: 'Large', value: 'h3' },
            { label: 'Small', value: 'h4' },
            { label: 'Smaller', value: 'h5' },
            { label: 'Smallest', value: 'h6' },
        ]
    },
    {
        type: 'textfield',
        input: true,
        label: 'Heading',
        tooltip: 'The heading to display.',
        key: 'content',
        placeholder: 'Your heading here',
        weight: 0,
        validate: {
            required: true
        }
    },
    {
        weight: 85,
        type: 'checkbox',
        label: 'Refresh On Change',
        tooltip: 'Rerender the field whenever a value on the form changes.',
        key: 'refreshOnChange',
        input: true
    },
];
