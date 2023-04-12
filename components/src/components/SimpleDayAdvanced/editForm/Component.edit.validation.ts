import common from '../../Common/Advanced.edit.validation';
import validationComponents from 'formiojs/components/day/editForm/Day.edit.validation';
import {reArrangeComponents} from '../../Common/function';

const neededposition = [
    'validate.isUseForCopy',
    'validateOn',
    'fields.day.required',
    'fields.month.required',
    'fields.year.required',
    'maxDate',
    'minDate',
    'unique',
    'errorLabel',
    'validate.customMessage',
    'custom-validation-js',
    'json-validation-json',
    'errors',
  ];

  const newPosition = reArrangeComponents(neededposition,[...validationComponents,...common]);


  export default newPosition;