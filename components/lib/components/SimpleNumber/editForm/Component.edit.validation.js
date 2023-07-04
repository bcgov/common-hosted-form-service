var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import common from '../../Common/Simple.edit.validation';
export default __spreadArray(__spreadArray([], common, true), [
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
], false);
