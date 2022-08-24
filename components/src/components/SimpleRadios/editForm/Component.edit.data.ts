import BuilderUtils from 'formiojs/utils/builder';
import _ from 'lodash';

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
        type: 'datagrid',
        input: true,
        label: 'Values',
        key: 'values',
        tooltip: 'The values that can be picked for this field. Values are text submitted with the form data. Labels are text that appears next to the radio buttons on the form.',
        weight: 10,
        reorder: true,
        defaultValue: [{ label: '', value: '' }],
        components: [
            {
                weight: 160,
                label: 'Label',
                key: 'label',
                input: true,
                type: 'textfield',
            },
            {
                weight: 170,
                label: 'Value',
                key: 'value',
                input: true,
                type: 'textfield',
                allowCalculateOverride: true,
                calculateValue: { _camelCase: [{ var: 'row.label' }] },
                validate: {
                    required: true
                }
            },
            {
                type: 'select',
                input: true,
                weight: 180,
                label: 'Shortcut',
                key: 'shortcut',
                tooltip: 'The shortcut key for this option.',
                dataSrc: 'custom',
                valueProperty: 'value',
                customDefaultValue: () => '',
                template: '{{ item.label }}',
                data: {
                    custom(context) {
                        return BuilderUtils.getAvailableShortcuts(
                            _.get(context, 'instance.options.editForm', {}),
                            _.get(context, 'instance.options.editComponent', {})
                        );
                    },
                },
            },
        ],
    },
];
