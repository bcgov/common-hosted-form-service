import common from '../../Common/Simple.edit.data';
export default
    {
        key: 'data',
        components: [
            ...common,
            {
                label: "Marker Type ",
                values: [
                    {
                        label: "Point Marker",
                        value: "marker"
                    },
                    {
                        label: "Circle Marker",
                        value: "circlemarker",
                    },
                    {
                        label: "Polygon",
                        value: "polygon",
                    },
                    {
                        label: "Polyline",
                        value: "polyline",
                    },
                    {
                        label: "Rectangle",
                        value: "rectangle",
                    },
                    {
                        label: "Circle",
                        value: "circle",
                    }
                ],
                key: "markerType",
                type: "simpleradios",
                input: true,
            },
            {
                label: "How many Points per Submission? (Only for Point Markers)",
                key: "numPoints",
                type: "simplenumber",
                defaultValue: 1,
                input: true,
              }            
        ]
    }

