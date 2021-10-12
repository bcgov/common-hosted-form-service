export default {
  key: 'display',
  components: [
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
      key: 'autofocus',
      ignore: true
    },
    {
      key: 'tabindex',
      ignore: true
    },
    {
      key: 'disabled',
      ignore: true
    },
    {
      key: 'tableView',
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
      key: 'legend',
      label: 'Caption',
      placeholder: 'Caption',
      tooltip: 'The caption for this Fieldset.'
    },
  ]
}
