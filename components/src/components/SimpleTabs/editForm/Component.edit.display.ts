import common from '../../Common/Simple.edit.display';
export default {
  key: 'display',
  components: [
    ...common,
    {
      key: 'labelPosition',
      ignore: true
    },
    {
      key: 'placeholder',
      ignore: true
    },
    {
      key: 'description',
      ignore: true
    },
    {
      key: 'tooltip',
      ignore: true
    },
    {
      key: 'disabled',
      ignore: true
    },
    {
      key: 'hideLabel',
      ignore: true
    },
    {
      key: 'components',
      type: 'datagrid',
      input: true,
      label: 'Tabs',
      weight: 50,
      reorder: true,
      components: [
        {
          type: 'textfield',
          input: true,
          key: 'label',
          label: 'Label'
        },
        {
          type: 'textfield',
          input: true,
          key: 'key',
          label: 'Key',
          allowCalculateOverride: true,
          calculateValue: { _camelCase: [{ var: 'row.label' }] }
        }
      ]
    }
  ]
}
