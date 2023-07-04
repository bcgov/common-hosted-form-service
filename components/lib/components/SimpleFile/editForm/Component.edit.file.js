export default [
    {
        type: 'datagrid',
        input: true,
        label: 'File Types',
        key: 'fileTypes',
        tooltip: 'Specify file types to classify the uploads. This is useful if you allow multiple types of uploads but want to allow the user to specify which type of file each is.',
        weight: 11,
        components: [
            {
                label: 'Label',
                key: 'label',
                input: true,
                type: 'textfield'
            },
            {
                label: 'Value',
                key: 'value',
                input: true,
                type: 'textfield'
            }
        ]
    },
    {
        type: 'textfield',
        input: true,
        key: 'filePattern',
        label: 'File Pattern',
        placeholder: '.pdf,.jpg',
        tooltip: 'See <a href=\'https://github.com/danialfarid/ng-file-upload#full-reference\' target=\'_blank\'>https://github.com/danialfarid/ng-file-upload#full-reference</a> for how to specify file patterns.',
        weight: 50
    }
];
