export default [
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
        key: 'autofocus',
        ignore: true
    },
    {
        key: 'tabindex',
        ignore: true
    },
    {
        key: 'disabled',
        ignore: true
    },
    {
        key: 'tableView',
        ignore: true
    },
    {
        key: 'hideLabel',
        ignore: true
    },
    {
        key: 'modalEdit',
        ignore: true
    },
    {
        key: 'label',
        hidden: true,
        calculateValue(context) {
            return context.data.legend;
        }
    },
    {
        key: 'tabindex',
        hidden: true,
    },
    {
        weight: 1,
        type: 'textfield',
        input: true,
        placeholder: 'Panel Title',
        label: 'Title',
        key: 'title',
        tooltip: 'The title text that appears in the header of this panel.'
    },
    {
        weight: 20,
        type: 'textarea',
        input: true,
        key: 'tooltip',
        label: 'Tooltip',
        placeholder: 'To add a tooltip to this field, enter text here.',
        tooltip: 'Adds a tooltip to the side of this field.'
    },
    {
        weight: 650,
        type: 'checkbox',
        label: 'Collapsible',
        tooltip: 'If checked, this will turn this Panel into a collapsible panel.',
        key: 'collapsible',
        input: true
    },
    {
        weight: 651,
        type: 'checkbox',
        label: 'Initially Collapsed',
        tooltip: 'Determines the initial collapsed state of this Panel.',
        key: 'collapsed',
        input: true,
        conditional: {
            json: { '===': [{ var: 'data.collapsible' }, true] }
        }
    }
];
