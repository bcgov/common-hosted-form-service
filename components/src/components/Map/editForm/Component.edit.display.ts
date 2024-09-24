export default {
  key: 'customDisplay',
  label: 'Display',
  weight: 10,
  components: [
    {
      key: 'label',
      label: 'Label',
      type: 'textfield',
      input: true,
      tooltip: 'The label for this field.',
    },
    {
      key: 'hideLabel',
      label: 'Hide Label',
      type: 'checkbox',
      tooltip:
        'Check to hide the label for this component. This allows you to show the label in the form Builder, but not when it is rendered',
      input: true,
    },
    {
      key: 'labelPosition',
      label: 'Label Position',
      type: 'select',
      input: true,
      data: {
        values: [
          { value: 'top', label: 'Top' },
          { value: 'left-left', label: 'Left (Left-aligned)' },
          { value: 'left-right', label: 'Left (Right-aligned)' },
          { value: 'right-left', label: 'Right (Left-aligned)' },
          { value: 'right-right', label: 'Right (Right-aligned)' },
          { value: 'bottom', label: 'Bottom' },
        ],
      },
      tooltip: 'Position of the label relative to the field.',
    },
    {
      key: 'description',
      label: 'Text Description (optional)',
      type: 'textarea',
      input: true,
      placeholder: 'This will appear below the map',
      tooltip: 'Enter a description for the map component here',
    },
    {
      key: 'tooltip',
      label: 'Tooltip',
      type: 'textarea',
      input: true,
      tooltip: 'Add a tooltip to provide additional information.',
      placeholder: 'Add a tooltip beside the label',
    },
    {
      key: 'customClass',
      label: 'Custom CSS Class',
      type: 'textfield',
      input: true,
      tooltip:
        'Assign one or more CSS class names to customize the appearance of this component.',
    },
  ],
};
