declare const Component_base: any;
export default class Component extends Component_base {
    static schema(...extend: any[]): any;
    static editForm: any;
    static get builderInfo(): {
        title: string;
        group: string;
        icon: string;
        weight: number;
        documentation: string;
        schema: any;
    };
}
export {};
