export default [
    {
        type: 'textfield',
        label: 'Default Value',
        key: 'defaultValue',
        weight: 5,
        placeholder: 'Default Value',
        tooltip: 'The will be the value for this field, before user interaction. Having a default value will override the placeholder text.',
        input: true
    },
    {
        type: 'textfield',
        input: true,
        key: 'dataFormat',
        label: 'Data Format',
        placeholder: 'HH:mm:ss',
        tooltip: 'The moment.js format for saving the value of this field.',
        weight: 25,
    },

];
