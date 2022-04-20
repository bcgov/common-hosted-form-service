
import Utils from 'formiojs/utils';

export default [
  {
    type: 'datagrid',
    input: true,
    label: 'Request Headers',
    key: 'data.headers',
    tooltip: 'Set any headers that should be sent along with the request to the url. This is useful for authentication.',
    weight: 11,
    components: [
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
      }
    ],
    
  },
];