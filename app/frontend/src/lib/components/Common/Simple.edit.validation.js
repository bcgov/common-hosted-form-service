/* eslint-disable quotes, max-len */
export default [
    {
        weight: 10,
        type: 'checkbox',
        label: 'Required',
        tooltip: 'A required field must be filled in before the form can be submitted.',
        key: 'validate.required',
        input: true
    },
    {
        weight: 0,
        type: 'select',
        key: 'validateOn',
        defaultValue: 'change',
        input: true,
        label: 'Validate On',
        tooltip: 'Determines when this component should trigger front-end validation.',
        dataSrc: 'values',
        data: {
            values: [
                { label: 'Change', value: 'change' },
                { label: 'Blur', value: 'blur' }
            ]
        }
    },
    {
        weight: 190,
        type: 'textfield',
        input: true,
        key: 'errorLabel',
        label: 'Error Label',
        placeholder: 'Error Label',
        tooltip: 'The label for this field when an error occurs.'
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
