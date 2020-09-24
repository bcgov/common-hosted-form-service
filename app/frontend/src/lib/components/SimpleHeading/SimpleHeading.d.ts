import editForm from './SimpleHeading.form';
declare const OrgBook_base: any;
export default class OrgBook extends OrgBook_base {
    static schema(...extend: any[]): any;
    static editForm: typeof editForm;
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
