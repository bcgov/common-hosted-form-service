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
], false);
