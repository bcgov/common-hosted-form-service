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
        type: 'textarea',
        input: true,
        editor: 'ace',
        rows: 10,
        as: 'html',
        label: 'Content',
        tooltip: 'The content of this Paragraph.',
        defaultValue: 'Content',
        key: 'content',
        weight: 80
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
