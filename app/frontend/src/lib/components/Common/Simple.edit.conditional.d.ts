declare const _default: {
    type: string;
    title: string;
    key: string;
    theme: string;
    components: ({
        type: string;
        input: boolean;
        label: string;
        key: string;
        dataSrc: string;
        data: {
            values: {
                label: string;
                value: string;
            }[];
        };
        valueProperty?: undefined;
    } | {
        type: string;
        input: boolean;
        label: string;
        key: string;
        dataSrc: string;
        valueProperty: string;
        data: {
            custom(context: any): any;
            values?: undefined;
        };
    } | {
        type: string;
        input: boolean;
        label: string;
        key: string;
        dataSrc?: undefined;
        data?: undefined;
        valueProperty?: undefined;
    })[];
}[];
export default _default;
