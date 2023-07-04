declare const _default: ({
    key: string;
    label: string;
    tooltip: string;
    type: string;
    values: {
        label: string;
        value: string;
    }[];
    weight: number;
    input?: undefined;
    dataSrc?: undefined;
    valueProperty?: undefined;
    data?: undefined;
    ignore?: undefined;
} | {
    type: string;
    input: boolean;
    label: string;
    key: string;
    dataSrc: string;
    valueProperty: string;
    tooltip: string;
    weight: number;
    customConditional(context: any): boolean;
    data: {
        custom(context: any): any[];
    };
    values?: undefined;
    ignore?: undefined;
} | {
    key: string;
    ignore: boolean;
    label?: undefined;
    tooltip?: undefined;
    type?: undefined;
    values?: undefined;
    weight?: undefined;
    input?: undefined;
    dataSrc?: undefined;
    valueProperty?: undefined;
    data?: undefined;
})[];
export default _default;
