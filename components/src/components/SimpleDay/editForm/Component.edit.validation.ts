export default [
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
  },
  {
    weight: 0,
    type: 'checkbox',
    label: 'Require Day',
    tooltip: 'A required field must be filled in before the form can be submitted.',
    key: 'fields.day.required',
    input: true
  },
  {
    weight: 10,
    type: 'checkbox',
    label: 'Require Month',
    tooltip: 'A required field must be filled in before the form can be submitted.',
    key: 'fields.month.required',
    input: true
  },
  {
    weight: 20,
    type: 'checkbox',
    label: 'Require Year',
    tooltip: 'A required field must be filled in before the form can be submitted.',
    key: 'fields.year.required',
    input: true
  },
  {
    weight: 40,
    type: 'textfield',
    label: 'Minimum Day',
    placeholder: 'yyyy-MM-dd',
    tooltip: 'A minimum date that can be set. You can also use Moment.js functions. For example: \n \n moment().subtract(10, \'days\')',
    key: 'minDate',
    input: true,
  },
  {
    weight: 30,
    type: 'textfield',
    label: 'Maximum Day',
    placeholder: 'yyyy-MM-dd',
    tooltip: 'A maximum day that can be set. You can also use Moment.js functions. For example: \n \n moment().add(10, \'days\')',
    key: 'maxDate',
    input: true,
  },
];
