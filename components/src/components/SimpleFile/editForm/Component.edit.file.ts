export default [
  {
    type: 'datagrid',
    input: true,
    label: 'File Types',
    key: 'fileTypes',
    tooltip:
      'Specify file types to classify the uploads. This is useful if you allow multiple types of uploads but want to allow the user to specify which type of file each is.',
    weight: 11,
    components: [
      {
        label: 'Label',
        key: 'label',
        input: true,
        type: 'textfield',
      },
      {
        label: 'Value',
        key: 'value',
        input: true,
        type: 'textfield',
      },
    ],
  },
  {
    type: 'textfield',
    input: true,
    key: 'filePattern',
    label: 'Allowed File Types',
    placeholder:
      'Leave empty for default or Customize to restrict: .pdf,.jpg,.png',
    tooltip:
      'Default allows for all safe types (non-executables). Enter specific extensions to restrict further.',
    weight: 50,
  },
];
