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
            key: 'attrs',
            ignore: true
        },
        {
            key: 'widget',
            ignore: true
        },
        {
            key: 'uniqueOptions',
            ignore: true
        },
    ], false)
};
