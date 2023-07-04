import common from '../../Common/Advanced.edit.validation';
import { reArrangeComponents } from '../../Common/function';
var neededposition = [
    'validate.isUseForCopy',
    'validateOn',
    'validate.required',
    'unique',
    'kickbox',
    'validate.minLength',
    'validate.maxLength',
    'validate.pattern',
    'errorLabel',
    'validate.customMessage',
    'errors',
    'custom-validation-js',
    'json-validation-json'
];
var newPosition = reArrangeComponents(neededposition, common);
export default newPosition;
