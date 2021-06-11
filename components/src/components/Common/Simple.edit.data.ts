/* eslint-disable max-len */
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
        type: 'select',
        input: true,
        key: 'redrawOn',
        label: 'Redraw On',
        weight: 600,
        tooltip: 'Redraw this component if another component changes. This is useful if interpolating parts of the component like the label.',
        dataSrc: 'custom',
        valueProperty: 'value',
        data: {
            custom(context) {
                const values = [];
                values.push({ label: 'Any Change', value: 'data' });
                context.utils.eachComponent(context.instance.options.editForm.components, (component, path) => {
                    if (component.key !== context.data.key) {
                        values.push({
                            label: component.label || component.key,
                            value: path
                        });
                    }
                });
                return values;
            }
        },
        conditional: {
            json: { '!' : [{ var: 'data.dataSrc' }] },
        },
    },
    {
        weight: 700,
        type: 'checkbox',
        label: 'Clear Value When Hidden',
        key: 'clearOnHide',
        defaultValue: true,
        tooltip: 'When a field is hidden, clear the value.',
        input: true
    },
];
/* eslint-enable max-len */
