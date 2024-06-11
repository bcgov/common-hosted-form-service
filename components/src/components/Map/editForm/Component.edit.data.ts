import common from '../../Common/Simple.edit.data';
export default
    {
        key: 'data',
        components: [
            ...common,
            {
                type: 'textfield',
                label: 'Default Center Latitude',
                key: 'centerLat',
                weight: 5,
                placeholder: 'Enter the latitude you would like for the default center',
                tooltip: 'The Default Center will be where the map will be centered before user interaction.',
                input: true
            },
        ]
    }

