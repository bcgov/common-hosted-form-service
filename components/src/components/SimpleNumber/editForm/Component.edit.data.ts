import common from '../../Common/Simple.edit.data';
export default [
  ...common,
    {
        type: 'checkbox',
        input: true,
        weight: 70,
        key: 'delimiter',
        label: 'Use Thousands Separator',
        tooltip: 'Separate thousands by local delimiter.'
    },
];
