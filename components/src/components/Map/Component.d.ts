import { Components } from 'formiojs';
declare const FieldComponent: typeof Components.components.field;
declare class MapComponent extends FieldComponent {
    static schema(...extend: any[]): import("formiojs").ExtendedComponentSchema<any>;
    static get builderInfo(): {
        title: string;
        group: string;
        icon: string;
        weight: number;
        schema: import("formiojs").ExtendedComponentSchema<any>;
    };
    render(): any;
    attach(element: HTMLElement): void;
    loadMap(): void;
}
export default MapComponent;
