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
export default __spreadArray(__spreadArray([], common, true), [
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
        weight: 160,
        type: 'checkbox',
        label: 'Auto adjust columns',
        tooltip: 'Will automatically adjust columns based on if nested components are hidden.',
        key: 'autoAdjust',
        input: true
    },
    {
        weight: 161,
        type: 'checkbox',
        label: 'Hide Column when Children Hidden',
        key: 'hideOnChildrenHidden',
        tooltip: 'Check this if you would like to hide any column when the children within that column are also hidden',
        input: true
    }
], false);
