export default [
  {
    type: 'select',
    input: true,
    weight: 0,
    tooltip: 'The source to use for the select data. Values lets you provide your own values and labels. JSON lets you provide raw JSON data. URL lets you provide a URL to retrieve the JSON data from.',
    key: 'dataSrc',
    defaultValue: 'values',
    label: 'Data Source Type',
    dataSrc: 'values',
    data: {
      values: [
        { label: 'URL', value: 'url' },
      ],
    },
  },
 
  {
    type: 'textfield',
    input: true,
    key: 'data.url',
    weight: 10,
    label: 'Data Source URL',
    placeholder: 'Data Source URL',
    tooltip: 'A URL that returns a JSON array to use as the data source.',
    conditional: {
      json: { '===': [{ var: 'data.dataSrc' }, 'url'] },
    },
  },
  {
    type: 'checkbox',
    input: true,
    label: 'Lazy Load Data',
    key: 'lazyLoad',
    tooltip: 'When set, this will not fire off the request to the URL until this control is within focus. This can improve performance if you have many Select dropdowns on your form where the API\'s will only fire when the control is activated.',
    weight: 11
  },
];