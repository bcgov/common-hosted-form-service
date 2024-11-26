export default {
  key: 'customData',
  label: 'Data',
  weight: 20,
  components: [
    {
      html: '<h2>Default Values</h2>',
      key: 'simplecontent1',
      type: 'content',
      input: false,
      tableView: false,
      label: 'Text/Images',
    },
    {
      type: 'map',
      label: 'Default Value',
      key: 'defaultValue',
      weight: 5,
      placeholder: 'Default Value',
      tooltip:
        'This will be the value for this field, before user interaction.',
      input: true,
    },

    {
      label: 'Default Zoom Level',
      description:
        'Zoom Levels are from 0 (Most zoomed out) to 18 (most zoomed in).',
      defaultValue: 5,
      delimiter: false,
      requireDecimal: false,
      validate: {
        isUseForCopy: false,
        min: 0,
        max: 18,
      },
      key: 'defaultZoom',
      type: 'number',
      input: true,
    },
    {
      key: 'center',
      type: 'map',
      input: true,
      label: 'Default Center',
      numPoints: 1,
      tableView: false,
      markerType: { marker: true },
      defaultZoom: 5,
      allowSubmissions: true,
      description:
        'Please select the desired default center using a single marker',
    },
    {
      html: '<h2>Submitter Options</h2>',
      key: 'simplecontent1',
      type: 'content',
      input: false,
      tableView: false,
      label: 'Text/Images',
    },
    {
      label: 'Allow submitters to add input on the map',
      description:
        'This allows for the user to view and scroll the map, but not add any input',
      key: 'allowSubmissions',
      type: 'checkbox',
      defaultValue: true,
      input: true,
    },
    {
      label: 'Marker Type ',
      values: [
        {
          label: 'Add a point marker (drop a pin)',
          value: 'marker',
        },
        {
          label: 'Add circular area of interest with a point and custom radius',
          value: 'circle',
        },
        {
          label: 'Add a polygon',
          value: 'polygon',
        },
        {
          label: 'Add a line',
          value: 'polyline',
        },
      ],
      defaultValue: 'marker',
      key: 'markerType',
      type: 'selectboxes',
      input: true,
    },
    {
      label: 'How many Markers per Submission?',
      key: 'numPoints',
      type: 'number',
      defaultValue: 1,
      input: true,
    },
    {
      label: 'Enable Submitter "My Location" button',
      description:
        'This allows for the user to center the map on their location.',
      key: 'myLocation',
      type: 'checkbox',
      input: true,
      defaultValue: true,
    },
    {
      label: 'Enable BC Address Autocomplete',
      description:
        'This allows for the user to enter an address and have results appear in a dropdown. The user can then select the result which fits best and have the map center on that location',
      key: 'bcGeocoder',
      type: 'checkbox',
      input: true,
      defaultValue: true,
    },
  ],
};
