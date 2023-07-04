declare const _default: ({
    type: string;
    label: string;
    key: string;
    weight: number;
    placeholder: string;
    tooltip: string;
    input: boolean;
    reorder?: undefined;
    defaultValue?: undefined;
    components?: undefined;
} | {
    type: string;
    input: boolean;
    label: string;
    key: string;
    tooltip: string;
    weight: number;
    reorder: boolean;
    defaultValue: {
        label: string;
        value: string;
    }[];
    components: ({
        weight: number;
        label: string;
        key: string;
        input: boolean;
        type: string;
        allowCalculateOverride?: undefined;
        calculateValue?: undefined;
        validate?: undefined;
        tooltip?: undefined;
        dataSrc?: undefined;
        valueProperty?: undefined;
        customDefaultValue?: undefined;
        template?: undefined;
        data?: undefined;
    } | {
        weight: number;
        label: string;
        key: string;
        input: boolean;
        type: string;
        allowCalculateOverride: boolean;
        calculateValue: {
            _camelCase: {
                var: string;
            }[];
        };
        validate: {
            required: boolean;
        };
        tooltip?: undefined;
        dataSrc?: undefined;
        valueProperty?: undefined;
        customDefaultValue?: undefined;
        template?: undefined;
        data?: undefined;
    } | {
        type: string;
        input: boolean;
        weight: number;
        label: string;
        key: string;
        tooltip: string;
        dataSrc: string;
        valueProperty: string;
        customDefaultValue: () => string;
        template: string;
        data: {
            custom(context: any): any;
        };
        allowCalculateOverride?: undefined;
        calculateValue?: undefined;
        validate?: undefined;
    })[];
    placeholder?: undefined;
})[];
export default _default;
