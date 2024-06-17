import common from '../../Common/Simple.edit.data';
export default
    {
        key: 'data',
        components: [
            ...common,
            {
                type: 'map',
                label: 'Map Default Center',
                key: 'centerDefault',
                weight: 5,
                placeholder: 'choose where you would like for the default center',
                tooltip: 'The Default Center will be where the map will be centered before user interaction.',
                input: true
            },
        ]
    }

