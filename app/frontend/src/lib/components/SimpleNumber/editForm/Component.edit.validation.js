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
        label: 'Minimum Value',
        key: 'validate.min',
        input: true,
        placeholder: 'Minimum Value',
        tooltip: 'The minimum value this field must have before the form can be submitted.',
        weight: 150
    },
    {
        type: 'number',
        label: 'Maximum Value',
        key: 'validate.max',
        input: true,
        placeholder: 'Maximum Value',
        tooltip: 'The maximum value this field can have before the form can be submitted.',
        weight: 160
    }
]);
