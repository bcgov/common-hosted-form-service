import common from '../../Common/Simple.edit.data';
export default [
  ...common,
    {
        weight: 200,
        type: 'radio',
        label: 'Text Case',
        key: 'case',
        tooltip: 'When data is entered, you can change the case of the value.',
        input: true,
        values: [
            {
                value: 'mixed',
                label: 'Mixed (Allow upper and lower case)'
            },
            {
                value: 'uppercase',
                label: 'Uppercase'
            },{
                value: 'lowercase',
                label: 'Lowercase'
            }
        ]
    }
];
