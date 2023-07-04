var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import common from '../../Common/Advanced.edit.validation';
import validationComponents from 'formiojs/components/checkbox/editForm/Checkbox.edit.validation';
import { reArrangeComponents } from '../../Common/function';
var neededposition = [
    'validate.isUseForCopy',
    'validate.required',
    'errorLabel',
    'validate.customMessage',
    'custom-validation-js',
    'json-validation-json',
    'errors',
];
var newPosition = reArrangeComponents(neededposition, __spreadArray(__spreadArray([], validationComponents, true), common, true));
export default newPosition;
