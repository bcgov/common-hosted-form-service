declare const _default: ({
    weight: number;
    type: string;
    label: string;
    tooltip: string;
    key: string;
    input: boolean;
    placeholder?: undefined;
    dataSrc?: undefined;
    valueProperty?: undefined;
    data?: undefined;
    conditional?: undefined;
    defaultValue?: undefined;
} | {
    type: string;
    label: string;
    key: string;
    weight: number;
    placeholder: string;
    tooltip: string;
    input: boolean;
    dataSrc?: undefined;
    valueProperty?: undefined;
    data?: undefined;
    conditional?: undefined;
    defaultValue?: undefined;
} | {
    type: string;
    input: boolean;
    key: string;
    label: string;
    weight: number;
    tooltip: string;
    dataSrc: string;
    valueProperty: string;
    data: {
        custom(context: any): any[];
    };
    conditional: {
        json: {
            '!': {
                var: string;
            }[];
        };
    };
    placeholder?: undefined;
    defaultValue?: undefined;
} | {
    weight: number;
    type: string;
    label: string;
    key: string;
    defaultValue: boolean;
    tooltip: string;
    input: boolean;
    placeholder?: undefined;
    dataSrc?: undefined;
    valueProperty?: undefined;
    data?: undefined;
    conditional?: undefined;
} | {
    key: string;
    ignore: boolean;
})[];
export default _default;
