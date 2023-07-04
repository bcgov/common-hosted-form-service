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
import validationComponents from 'formiojs/components/select/editForm/Select.edit.validation';
import { reArrangeComponents } from '../../Common/function';
var neededposition = [
    'validate.isUseForCopy',
    'validateOn',
    'validate.required',
    'validate.onlyAvailableItems',
    'unique',
    'errorLabel',
    'validate.customMessage',
    'custom-validation-js',
    'json-validation-json',
    'errors',
];
var componentSpecific = {
    weight: 52,
    type: 'checkbox',
    label: 'Allow only available values',
    tooltip: 'Check this if you would like to perform a validation check to ensure the selected value is an available option (only for synchronous values).',
    key: 'validate.onlyAvailableItems',
    input: true,
    conditional: {
        json: {
            in: [{
                    var: 'data.dataSrc'
                }, ['values', 'json', 'custom']]
        }
    }
};
var newPosition = reArrangeComponents(neededposition, __spreadArray(__spreadArray([componentSpecific], validationComponents, true), common, true));
export default newPosition;
