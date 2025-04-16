export default {
  key: 'customData',
  label: 'Data',
  weight: 2,
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
      label: 'Default Base Layer',
      key: 'defaultBaseLayer',
      type: 'select',
      input: true,
      defaultValue: 'OpenStreetMap',
      data: {
        values: [
          { label: 'OpenStreetMap', value: 'OpenStreetMap' },
          { label: 'Satellite', value: 'Satellite' },
          { label: 'Topographic', value: 'Topographic' },
          { label: 'ESRI World Imagery', value: 'ESRIWorldImagery' },
        ]
      },
      description: 'Select which base layer is shown by default when the map loads.'
    },
    {
      label: 'Allow Submitter to Switch Base Layers',
      key: 'allowBaseLayerSwitch',
      type: 'checkbox',
      input: true,
      defaultValue: true,
      description: 'If checked, submitters can toggle between available base layers.'
    },
    {
      label: 'Available Base Layers for Submitter',
      key: 'availableBaseLayers',
      type: 'selectboxes',
      input: true,
      defaultValue: {
        OpenStreetMap: true,
        Light:false,
        Dark:false,
        Satellite: true,
        Topographic: false,
        ESRIWorldImagery: false,
      },
      values: [
        { label: 'OpenStreetMap', value: 'OpenStreetMap' },
        { label: 'Light', value: 'Light' },
        { label: 'Dark', value: 'Dark' },
        { label: 'Satellite', value: 'Satellite' },
        { label: 'Topographic', value: 'Topographic' },
        { label: 'ESRI World Imagery', value: 'ESRIWorldImagery' },
      ],
      description: 'Select which base layers the submitter can toggle between.'
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
