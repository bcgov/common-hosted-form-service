declare const _default: {
    key: string;
    components: ({
        key: string;
        ignore: boolean;
    } | {
        key: string;
        type: string;
        input: boolean;
        label: string;
        weight: number;
        reorder: boolean;
        components: ({
            type: string;
            input: boolean;
            key: string;
            label: string;
            allowCalculateOverride?: undefined;
            calculateValue?: undefined;
        } | {
            type: string;
            input: boolean;
            key: string;
            label: string;
            allowCalculateOverride: boolean;
            calculateValue: {
                _camelCase: {
                    var: string;
                }[];
            };
        })[];
    })[];
};
export default _default;
