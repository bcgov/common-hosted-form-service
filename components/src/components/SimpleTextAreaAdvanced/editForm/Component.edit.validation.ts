import common from '../../Common/Advanced.edit.validation';
import {reArrangeComponents} from '../../Common/function';

const neededposition = [
    'validate.isUseForCopy',
    'validateOn',
    'validate.required',
    'unique',
    'validate.minLength',
    'validate.maxLength',
    'validate.minWords',
    'validate.maxWords',
    'validate.pattern',
    'errorLabel',
    'validate.customMessage',
    'errors',
    'custom-validation-js',
    'json-validation-json'
  ];

  const newPosition = reArrangeComponents(neededposition,common);

  export default newPosition;