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
        weight: 110,
        key: 'validate.minLength',
        label: 'Minimum Length',
        placeholder: 'Minimum Length',
        type: 'number',
        tooltip: 'The minimum length requirement this field must meet.',
        input: true
    },
    {
        weight: 120,
        key: 'validate.maxLength',
        label: 'Maximum Length',
        placeholder: 'Maximum Length',
        type: 'number',
        tooltip: 'The maximum length requirement this field must meet.',
        input: true
    }
]);
