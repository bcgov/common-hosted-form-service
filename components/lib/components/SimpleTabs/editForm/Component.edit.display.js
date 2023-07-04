var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import common from '../../Common/Simple.edit.display';
export default {
    key: 'display',
    components: __spreadArray(__spreadArray([], common, true), [
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
            key: 'disabled',
            ignore: true
        },
        {
            key: 'hideLabel',
            ignore: true
        },
        {
            key: 'components',
            type: 'datagrid',
            input: true,
            label: 'Tabs',
            weight: 50,
            reorder: true,
            components: [
                {
                    type: 'textfield',
                    input: true,
                    key: 'label',
                    label: 'Label'
                },
                {
                    type: 'textfield',
                    input: true,
                    key: 'key',
                    label: 'Key',
                    allowCalculateOverride: true,
                    calculateValue: { _camelCase: [{ var: 'row.label' }] }
                }
            ]
        }
    ], false)
};
