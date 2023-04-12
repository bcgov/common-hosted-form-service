import common from '../../Common/Advanced.edit.validation';
import validationComponents from 'formiojs/components/selectboxes/editForm/SelectBoxes.edit.validation';
import {reArrangeComponents} from '../../Common/function';

const neededposition = [
    'validate.isUseForCopy',
    'validate.required',
    'validate.onlyAvailableItems',
    'errorLabel',
    'validate.customMessage',
    'validate.minSelectedCount',
    'validate.maxSelectedCount',
    'minSelectedCountMessage',
    'maxSelectedCountMessage',
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