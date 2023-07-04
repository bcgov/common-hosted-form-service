import common from '../../Common/Advanced.edit.validation';
import { reArrangeComponents } from '../../Common/function';
var neededposition = [
    'validate.isUseForCopy',
    'validate.required',
    'unique',
    'validateOn',
    'errorLabel',
    'validate.customMessage',
    'custom-validation-js',
    'json-validation-json',
    'errors',
];
var newPosition = reArrangeComponents(neededposition, common);
export default newPosition;
