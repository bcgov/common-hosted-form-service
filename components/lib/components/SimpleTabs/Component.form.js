var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import nestedComponentForm from 'formiojs/components/_classes/nested/NestedComponent.form';
import EditDisplay from './editForm/Component.edit.display';
import SimpleApi from '../Common/Simple.edit.api';
import SimpleConditional from '../Common/Simple.edit.conditional';
export default function () {
    var extend = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        extend[_i] = arguments[_i];
    }
    return nestedComponentForm.apply(void 0, __spreadArray([[
            EditDisplay,
            {
                key: 'data',
                ignore: true,
            },
            {
                key: 'api',
                ignore: true
            },
            {
                key: 'layout',
                ignore: true
            },
            {
                key: 'conditional',
                ignore: true
            },
            {
                key: 'validation',
                ignore: true
            },
            {
                key: 'logic',
                ignore: true
            },
            {
                label: 'API',
                key: 'customAPI',
                weight: 30,
                components: SimpleApi
            },
            {
                label: 'Conditional',
                key: 'customConditional',
                weight: 40,
                components: SimpleConditional
            }
        ]], extend, false));
}
