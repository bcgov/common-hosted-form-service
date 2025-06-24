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
      'Default allows: documents (.pdf, .doc, .docx, .txt), images (.jpg, .png, .gif, .svg), spreadsheets (.xlsx, .csv), media files (.mp4, .mp3), and other safe types. Enter specific extensions to restrict further.',
    weight: 50,
  },
];
