import common from '../../Common/Simple.edit.validation';
export default [
    ...common,
    {
        weight: 110,
        key: 'validate.minLength',
        label: 'Minimum Length',
        placeholder: 'Minimum Length',
        type: 'number',
        tooltip: 'The minimum length requirement this field must meet.',
        input: true
    },
    {
        weight: 120,
        key: 'validate.maxLength',
        label: 'Maximum Length',
        placeholder: 'Maximum Length',
        type: 'number',
        tooltip: 'The maximum length requirement this field must meet.',
        input: true
    },
    {
        weight: 125,
        key: 'validate.minWords',
        label: 'Minimum Word Length',
        placeholder: 'Minimum Word Length',
        type: 'number',
        tooltip: 'The minimum amount of words that can be added to this field.',
        input: true
    },
    {
        weight: 126,
        key: 'validate.maxWords',
        label: 'Maximum Word Length',
        placeholder: 'Maximum Word Length',
        type: 'number',
        tooltip: 'The maximum amount of words that can be added to this field.',
        input: true
    },
];
