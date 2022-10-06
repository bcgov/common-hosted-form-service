/* eslint-disable quotes, max-len */
export default [
    {
        weight: 10,
        type: 'checkbox',
        defaultValue: true,
        label: 'Use for copy',
        tooltip: 'When checked, the value of this field can be use for copy submission feature.',
        key: 'validate.isUseForCopy',
        input: true
    },
    {
        weight: 10,
        type: 'checkbox',
        label: 'Required',
        tooltip: 'A required field must be filled in before the form can be submitted.',
        key: 'validate.required',
        input: true
    },
    {
        weight: 200,
        key: 'validate.customMessage',
        label: 'Custom Error Message',
        placeholder: 'Custom Error Message',
        type: 'textfield',
        tooltip: 'Error message displayed if any error occurred.',
        input: true
    }
];
/* eslint-enable quotes, max-len */
