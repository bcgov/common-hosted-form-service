var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
import common from '../../Common/Simple.edit.validation';
export default __spreadArrays(common, [
    {
        type: 'number',
        input: true,
        key: 'validate.minSelectedCount',
        label: 'Minimum checked number',
        tooltip: 'Minimum checkboxes required before form can be submitted.',
        weight: 250
    },
    {
        type: 'number',
        input: true,
        key: 'validate.maxSelectedCount',
        label: 'Maximum checked number',
        tooltip: 'Maximum checkboxes possible before form can be submitted.',
        weight: 250
    },
    {
        type: 'textfield',
        input: true,
        key: 'minSelectedCountMessage',
        label: 'Minimum checked error message',
        tooltip: 'Error message displayed if minimum number of items not checked.',
        weight: 250
    },
    {
        type: 'textfield',
        input: true,
        key: 'maxSelectedCountMessage',
        label: 'Maximum checked error message',
        tooltip: 'Error message displayed if maximum number of items checked.',
        weight: 250
    }
]);
