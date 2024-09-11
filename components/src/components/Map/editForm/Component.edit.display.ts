export default {
  key: 'display',
  components: [
    {
      key: 'description',
      label: 'Text Description (optional)',
      placeholder: 'This will appear below the map',
      tooltip: 'Enter a description for the map component here', // Example change
    },
    {
      key: 'customClass',
      tooltip:
        'Assign one or more CSS class names to customize the appearance of this component',
    },
    {
      // You can ignore existing fields.
      key: 'placeholder',
      ignore: true,
    },
    {
      key: 'tableView',
      ignore: true,
    },
    {
      key: 'hidden',
      ignore: true,
    },
    {
      key: 'autofocus',
      ignore: true,
    },
    {
      key: 'tabindex',
      ignore: true,
    },
    {
      key: 'modalEdit',
      ignore: true,
    },
    {
      key: 'disabled',
      ignore: true,
    },
    {
      key: 'hideLabel',
      label: 'Hide Label',
      weight: 10,
    },
  ],
};
