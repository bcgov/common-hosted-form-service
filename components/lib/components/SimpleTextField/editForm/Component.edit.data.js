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
        weight: 200,
        type: 'radio',
        label: 'Text Case',
        key: 'case',
        tooltip: 'When data is entered, you can change the case of the value.',
        input: true,
        values: [
            {
                value: 'mixed',
                label: 'Mixed (Allow upper and lower case)'
            },
            {
                value: 'uppercase',
                label: 'Uppercase'
            }, {
                value: 'lowercase',
                label: 'Lowercase'
            }
        ]
    }
], false);
