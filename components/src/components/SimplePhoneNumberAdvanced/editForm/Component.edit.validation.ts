import common from '../../Common/Advanced.edit.validation';
import {reArrangeComponents} from '../../Common/function';

const neededposition = [
    'validate.isUseForCopy',
    'validateOn',
    'validate.required',
    'unique',
    'errorLabel',
    'validate.customMessage',
    'custom-validation-js',
    'json-validation-json',
    'errors'
  ];

  const newPosition = reArrangeComponents(neededposition,common);

  export default newPosition;