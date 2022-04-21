import common from '../../../Common/Simple.edit.validation';
export default [
    ...common,
    {
        weight: 210,
        key: 'validate.pattern',
        label: 'Postal Code Pattern',
        type: 'input',
        input: true
    },
    {
        weight: 220,
        key: 'validate.customMessage',
        label: 'Custom Error Message',
        placeholder: 'Custom Error Message',
        type: 'textfield',
        tooltip: 'Error message displayed if any error occurred.',
        input: true
    }
];
