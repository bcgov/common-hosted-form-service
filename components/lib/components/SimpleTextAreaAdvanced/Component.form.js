var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import baseEditForm from 'formiojs/components/textarea/TextArea.form';
import EditValidation from './editForm/Component.edit.validation';
export default function () {
    var extend = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        extend[_i] = arguments[_i];
    }
    return baseEditForm.apply(void 0, __spreadArray([[
            {
                key: 'validation',
                ignore: true
            },
            {
                label: 'Validation',
                key: 'customValidation',
                weight: 20,
                components: EditValidation
            }
        ]], extend, false));
}
