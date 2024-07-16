export default {
  key: 'customData',
  label: 'Data',
  weight: 20,
  components: [
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
      label: 'Marker Type ',
      values: [
        {
          label: 'Add a point marker (drop a pin)',
          value: 'marker',
        },
        {
          label:
            'Add circular area of interest through a point and custom radius',
          value: 'circle',
        },
      ],
      defaultValue: 'marker',
      key: 'markerType',
      type: 'simpleradios',
      input: true,
    },
    {
      label: 'How many Markers per Submission?',
      key: 'numPoints',
      type: 'simplenumber',
      defaultValue: 1,
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
      type: 'simplenumber',
      input: true,
    },
    {
      key: 'center',
      type: 'map',
      input: true,
      label: 'Default Center',
      numPoints: 1,
      tableView: false,
      markerType: 'marker',
      defaultZoom: 13,
      readOnlyMap: false,
      description:
        'Please select the desired default center using a single marker',
    },
    {
      label: 'Read Only Map',
      description:
        'This allows for the user to view and scroll the map, but not add any input',
      key: 'readOnlyMap',
      type: 'simplecheckbox',
      input: true,
    },
  ],
};
