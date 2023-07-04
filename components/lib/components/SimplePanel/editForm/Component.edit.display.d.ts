declare const _default: {
    key: string;
    components: ({
        key: string;
        ignore: boolean;
    } | {
        key: string;
        hidden: boolean;
        calculateValue(context: any): any;
        weight?: undefined;
        type?: undefined;
        input?: undefined;
        placeholder?: undefined;
        label?: undefined;
        tooltip?: undefined;
        conditional?: undefined;
        dataSrc?: undefined;
        data?: undefined;
    } | {
        weight: number;
        type: string;
        input: boolean;
        placeholder: string;
        label: string;
        key: string;
        tooltip: string;
        hidden?: undefined;
        calculateValue?: undefined;
        conditional?: undefined;
        dataSrc?: undefined;
        data?: undefined;
    } | {
        weight: number;
        type: string;
        label: string;
        tooltip: string;
        key: string;
        input: boolean;
        hidden?: undefined;
        calculateValue?: undefined;
        placeholder?: undefined;
        conditional?: undefined;
        dataSrc?: undefined;
        data?: undefined;
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
        hidden?: undefined;
        calculateValue?: undefined;
        placeholder?: undefined;
        dataSrc?: undefined;
        data?: undefined;
    } | {
        type: string;
        key: string;
        label: string;
        input: boolean;
        tooltip: string;
        dataSrc: string;
        weight: number;
        data: {
            values: {
                label: string;
                value: string;
            }[];
        };
        hidden?: undefined;
        calculateValue?: undefined;
        placeholder?: undefined;
        conditional?: undefined;
    })[];
};
export default _default;
