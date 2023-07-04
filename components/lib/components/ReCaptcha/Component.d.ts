import editForm from './Component.form';
export declare const AddressComponentMode: {
    Autocomplete: string;
    Manual: string;
};
declare const Component_base: any;
export default class Component extends Component_base {
    static schema(...extend: any[]): any;
    static get builderInfo(): {
        title: string;
        group: string;
        icon: string;
        weight: number;
        documentation: string;
        schema: any;
    };
    static editForm: typeof editForm;
    createInput(): void;
    createLabel(): void;
    verify(actionName: any): void;
    beforeSubmit(): any;
    sendVerificationRequest(token: any): any;
    checkComponentValidity(data: any, dirty: any, row: any, options?: {}): any;
    normalizeValue(newValue: any): any;
}
export {};
