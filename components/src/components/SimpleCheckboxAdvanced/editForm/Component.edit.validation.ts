import common from '../../Common/Advanced.edit.validation';
import validationComponents from 'formiojs/components/checkbox/editForm/Checkbox.edit.validation';
import {reArrangeComponents} from '../../Common/function';

const neededposition = [
    'validate.isUseForCopy',
    'validate.required',
    'errorLabel',
    'validate.customMessage',
    'custom-validation-js',
    'json-validation-json',
    'errors',
  ];

  const newPosition = reArrangeComponents(neededposition,[...validationComponents,...common]);


  export default newPosition;