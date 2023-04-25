import common from '../../Common/Advanced.edit.validation';
import validationComponents from 'formiojs/components/select/editForm/Select.edit.validation';
import {reArrangeComponents} from '../../Common/function';

const neededposition = [
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

  const componentSpecific =  {
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
  }

  const newPosition = reArrangeComponents(neededposition,[componentSpecific, ...validationComponents,...common]);


  export default newPosition;