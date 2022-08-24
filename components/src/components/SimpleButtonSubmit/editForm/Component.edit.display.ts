import common from '../../Common/Simple.edit.display';
export default {
  key: 'display',
  components: [
    ...common,
    {
      key: 'refreshOnChange',
      ignore: true
    },
    {
      key: 'className',
      ignore: true,
    },
    {
      key: 'labelPosition',
      ignore: true,
    },
    {
      key: 'placeholder',
      ignore: true,
    },
    {
      key: 'hideLabel',
      ignore: true,
    },
    {
      type: 'checkbox',
      key: 'block',
      label: 'Block Button',
      input: true,
      weight: 155,
      tooltip: 'This control should span the full width of the bounding container.',
    },
    {
      type: 'checkbox',
      key: 'disableOnInvalid',
      label: 'Disable on Form Invalid',
      tooltip: 'This will disable this field if the form is invalid.',
      input: true,
      weight: 620,
    },
  ]
}
