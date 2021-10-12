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
      key: 'modalEdit',
      ignore: true
    },
    {
      key: 'label',
      hidden: true,
      calculateValue(context) {
        return context.data.legend;
      }
    },
    {
      weight: 1,
      type: 'textfield',
      input: true,
      placeholder: 'Panel Title',
      label: 'Title',
      key: 'title',
      tooltip: 'The title text that appears in the header of this panel.'
    },
    {
      weight: 650,
      type: 'checkbox',
      label: 'Collapsible',
      tooltip: 'If checked, this will turn this Panel into a collapsible panel.',
      key: 'collapsible',
      input: true
    },
    {
      weight: 651,
      type: 'checkbox',
      label: 'Initially Collapsed',
      tooltip: 'Determines the initial collapsed state of this Panel.',
      key: 'collapsed',
      input: true,
      conditional: {
        json: { '===': [{ var: 'data.collapsible' }, true] }
      }
    },
    {
      type: 'select',
      key: 'theme',
      label: 'Theme',
      input: true,
      tooltip: 'The color theme of this button.',
      dataSrc: 'values',
      weight: 140,
      data: {
        values: [
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' },
          { label: 'Info', value: 'info' },
          { label: 'Success', value: 'success' },
          { label: 'Danger', value: 'danger' },
          { label: 'Warning', value: 'warning' },
        ],
      },
    },
  ]
}
