var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import ComponentEditValidation from 'formiojs/components/_classes/component/editForm/Component.edit.validation';
import TextFieldEditValidation from 'formiojs/components/textfield/editForm/TextField.edit.validation';
import UseForCopy from './UseForCopy';
var kickbox = {
    type: 'panel',
    label: 'Kickbox',
    title: 'Kickbox',
    weight: 102,
    key: 'kickbox',
    components: [{
            type: 'checkbox',
            label: 'Enable',
            tooltip: 'Enable Kickbox validation for this email field.',
            description: 'Validate this email using the Kickbox email validation service.',
            key: 'kickbox.enabled'
        }]
};
export default __spreadArray(__spreadArray([kickbox, UseForCopy], ComponentEditValidation, true), TextFieldEditValidation, true);
// const neededposition = [
//   'validate.isUseForCopy',
//   'validateOn',
//   'validate.required',
//   'unique',
//   'kickbox',
//   'validate.minLength',
//   'validate.maxLength',
//   'validate.minWords',
//   'validate.maxWords',
//   'validate.pattern',
//   'errorLabel',
//   'validate.customMessage',
//   'errors',
//   'custom-validation-js',
//   'json-validation-json'
// ];
// var newPosition = [];
// neededposition.map((posKey) => {
//     [kickbox,UseForCopy,...TextFieldEditValidation,...ComponentEditValidation].findIndex((comp) => {
//         if(comp.key === posKey){newPosition.push(comp);}
//     });
// })
// export default newPosition;
