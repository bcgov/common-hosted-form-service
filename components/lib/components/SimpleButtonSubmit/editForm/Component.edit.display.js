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
            key: 'refreshOnChange',
            ignore: true
        },
        {
            key: 'className',
            ignore: true,
        },
        {
            key: 'labelPosition',
            ignore: true,
        },
        {
            key: 'placeholder',
            ignore: true,
        },
        {
            key: 'hideLabel',
            ignore: true,
        },
        {
            type: 'checkbox',
            key: 'block',
            label: 'Block Button',
            input: true,
            weight: 155,
            tooltip: 'This control should span the full width of the bounding container.',
        },
        {
            type: 'checkbox',
            key: 'disableOnInvalid',
            label: 'Disable on Form Invalid',
            tooltip: 'This will disable this field if the form is invalid.',
            input: true,
            weight: 620,
        },
    ], false)
};
