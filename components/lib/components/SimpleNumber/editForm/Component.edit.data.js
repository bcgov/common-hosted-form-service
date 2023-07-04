var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import common from '../../Common/Simple.edit.data';
export default __spreadArray(__spreadArray([], common, true), [
    {
        type: 'checkbox',
        input: true,
        weight: 70,
        key: 'delimiter',
        label: 'Use Thousands Separator',
        tooltip: 'Separate thousands by local delimiter.'
    },
    {
        type: 'number',
        input: true,
        weight: 80,
        key: 'decimalLimit',
        label: 'Decimal Places',
        tooltip: 'The maximum number of decimal places.'
    },
    {
        type: 'checkbox',
        input: true,
        weight: 90,
        key: 'requireDecimal',
        label: 'Require Decimal',
        tooltip: 'Always show decimals, even if trailing zeros.'
    },
], false);
