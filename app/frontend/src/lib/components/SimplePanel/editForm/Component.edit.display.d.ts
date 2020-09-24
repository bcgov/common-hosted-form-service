declare const _default: ({
    key: string;
    ignore: boolean;
    hidden?: undefined;
    calculateValue?: undefined;
    weight?: undefined;
    type?: undefined;
    input?: undefined;
    placeholder?: undefined;
    label?: undefined;
    tooltip?: undefined;
    conditional?: undefined;
} | {
    key: string;
    hidden: boolean;
    calculateValue(context: any): any;
    ignore?: undefined;
    weight?: undefined;
    type?: undefined;
    input?: undefined;
    placeholder?: undefined;
    label?: undefined;
    tooltip?: undefined;
    conditional?: undefined;
} | {
    key: string;
    hidden: boolean;
    ignore?: undefined;
    calculateValue?: undefined;
    weight?: undefined;
    type?: undefined;
    input?: undefined;
    placeholder?: undefined;
    label?: undefined;
    tooltip?: undefined;
    conditional?: undefined;
} | {
    weight: number;
    type: string;
    input: boolean;
    placeholder: string;
    label: string;
    key: string;
    tooltip: string;
    ignore?: undefined;
    hidden?: undefined;
    calculateValue?: undefined;
    conditional?: undefined;
} | {
    weight: number;
    type: string;
    label: string;
    tooltip: string;
    key: string;
    input: boolean;
    ignore?: undefined;
    hidden?: undefined;
    calculateValue?: undefined;
    placeholder?: undefined;
    conditional?: undefined;
} | {
    weight: number;
    type: string;
    label: string;
    tooltip: string;
    key: string;
    input: boolean;
    conditional: {
        json: {
            '===': (boolean | {
                var: string;
            })[];
        };
    };
    ignore?: undefined;
    hidden?: undefined;
    calculateValue?: undefined;
    placeholder?: undefined;
})[];
export default _default;
