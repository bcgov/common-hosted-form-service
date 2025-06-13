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
      allowSubmissions: true,
      defaultValue: { features: [], selectedBaseLayer: 'OpenStreetMap' },
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
      defaultValue: { features: [], selectedBaseLayer: 'OpenStreetMap' },
      allowBaseLayerSwitch: false,
      availableBaseLayers: {
        OpenStreetMap: true,
        Light: true,
        Dark: true,
        Topographic: true,
      },
    },
    {
      html: '<h2>Submitter Options</h2>',
      key: 'simplecontent2',
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
      label: 'Allow Submitters to Switch Base Layers',
      key: 'allowBaseLayerSwitch',
      type: 'checkbox',
      input: true,
      defaultValue: false,
      description:
        'If checked, submitters can toggle between available base layers.',
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
      label: 'Available Base Layers for Submitters',
      key: 'availableBaseLayers',
      type: 'selectboxes',
      input: true,
      defaultValue: {
        OpenStreetMap: true,
        Light: true,
        Dark: true,
        Topographic: true,
      },
      values: [
        { label: 'OpenStreetMap', value: 'OpenStreetMap' },
        { label: 'Light', value: 'Light' },
        { label: 'Dark', value: 'Dark' },
        { label: 'Topographic', value: 'Topographic' },
      ],
      description: 'Select which base layers the submitter can toggle between.',
      validate: {
        custom:
          'valid = Object.values(input).filter(v => v).length > 0 ? true : "At least one base layer must be selected.";',
      },
    },
    {
      label: 'Custom Base Layers',
      key: 'availableBaseLayersCustom',
      type: 'datagrid',
      input: true,
      reorder: false,
      addAnother: 'Add New Base Layer',
      defaultValue: [
        {
          label: 'SampleOpenStreetMap',
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenStreetMap contributors',
          enabled: false,
        },
      ],
      components: [
        {
          label: 'Label',
          key: 'label',
          input: true,
          type: 'textfield',
          placeholder: 'e.g., SampleOpenStreetMap',
          validate: {
            custom: `valid = !input || (typeof input === 'string' && input.length <= 100)? true: 'Label must be under 100 characters.';`,
          },
        },
        {
          label: 'Tile URL Template',
          key: 'url',
          input: true,
          type: 'textfield',
          placeholder: 'https://{s}.tile.provider.com/{z}/{x}/{y}.png',
          validate: {
            custom: `
          valid = !input || (
            typeof input === 'string' &&
            input.includes('{z}') &&
            input.includes('{x}') &&
            input.includes('{y}') &&
            /^https?:\\/\\//.test(input)
          ) ? true : 'Must be a valid URL containing {z}, {x}, and {y}.';
        `,
          },
        },
        {
          label: 'Attribution',
          key: 'attribution',
          input: true,
          type: 'textfield',
          placeholder: 'e.g., © OpenStreetMap contributors',
          tooltip:
            'The attribution text that appears on the map when this layer is active.',
          validate: {
            custom: `valid = !input || (typeof input === 'string') ? true : 'Attribution must be a text string.';`,
          },
        },
        {
          label: 'Include this layer?',
          key: 'enabled',
          type: 'checkbox',
          input: true,
          defaultValue: false,
          tooltip:
            'Check this box to include this custom base layer in the map.',
        },
      ],
      description:
        'Add custom base layers with a name, tile URL template (must include {z}, {x}, and {y}), and attribution. These layers can be dynamically loaded into the map.',
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
    {
      label: 'Show "Recenter Map" Button',
      description:
        'This allows users to recenter the map to the default center location.',
      key: 'recenterButton',
      type: 'checkbox',
      input: true,
      defaultValue: true,
    },
  ],
};
