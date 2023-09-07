import common from '../../Common/Advanced.edit.validation';
import {reArrangeComponents} from '../../Common/function';

const neededposition = [
    'validate.isUseForCopy',
    'validateOn',
    'validate.required',
    'validate.minLength',
    'validate.maxLength',
    'validate.pattern',
    'errorLabel',
    'validate.customMessage',
    'custom-validation-js',
    'json-validation-json',
    'errors',
  ];

  const newPosition = reArrangeComponents(neededposition,common);

  export default newPosition;
