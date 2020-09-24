import { getContextComponents } from 'formiojs/utils/utils';
/* eslint-disable quotes, max-len */
export default [
    {
        type: 'panel',
        title: 'Simple',
        key: 'simple-conditional',
        theme: 'default',
        components: [
            {
                type: 'select',
                input: true,
                label: 'This component should Display:',
                key: 'conditional.show',
                dataSrc: 'values',
                data: {
                    values: [
                        { label: 'True', value: 'true' },
                        { label: 'False', value: 'false' }
                    ]
                }
            },
            {
                type: 'select',
                input: true,
                label: 'When the form component:',
                key: 'conditional.when',
                dataSrc: 'custom',
                valueProperty: 'value',
                data: {
                    custom: function (context) {
                        return getContextComponents(context);
                    }
                }
            },
            {
                type: 'textfield',
                input: true,
                label: 'Has the value:',
                key: 'conditional.eq'
            }
        ]
    }
];
/* eslint-enable quotes, max-len */
