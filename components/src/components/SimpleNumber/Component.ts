/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.number;
import editForm from './Component.form';
import { addRoundingToSchema, RoundingConfig } from '../Common/Rounding.mixin';
import { Constants } from '../Common/Constants';

const ID = 'simplenumber';
const DISPLAY = 'Number';

// Define an interface for the methods we need from the base component
interface FormioComponentMethods {
    setValue(value: any, flags?: any): any;
    getValue(): any;
    calculateValue(data: any, flags: any, row: any): any;
    getValueAsString(value: any, options: any): string;
    component: any;
}

// Define the mixin as a function that takes a base class with the required methods
type Constructor<T = {}> = new (...args: any[]) => T;

function WithRounding<TBase extends Constructor<FormioComponentMethods>>(Base: TBase) {
    return class extends Base {
        /**
         * Apply rounding to a numeric value based on component configuration
         */
        applyRounding(value: number): number {
            const roundingConfig = (this as any).component.rounding as RoundingConfig;
            
            if (!roundingConfig?.enabled) {
                return value;
            }
            
            const decimalPlaces = roundingConfig.decimalPlaces || 2;
            const multiplier = Math.pow(10, decimalPlaces);
            
            switch (roundingConfig.method) {
                case 'floor':
                    return Math.floor(value * multiplier) / multiplier;
                case 'ceil':
                    return Math.ceil(value * multiplier) / multiplier;
                case 'round':
                default:
                    return Math.round(value * multiplier) / multiplier;
            }
        }

        /**
         * Process value with rounding if applicable
         */
        processValueWithRounding(value: any): any {
            if (value === null || value === undefined || value === '') {
                return value;
            }
            
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
                return value;
            }
            
            return this.applyRounding(numValue);
        }

        setValue(value: any, flags: any = {}) {
            const processedValue = this.processValueWithRounding(value);
            return super.setValue(processedValue, flags);
        }

        getValue() {
            const value = super.getValue();
            return this.processValueWithRounding(value);
        }

        calculateValue(data: any, flags: any, row: any) {
            const value = super.calculateValue(data, flags, row);
            return this.processValueWithRounding(value);
        }

        getValueAsString(value: any, options: any): string {
            const roundingConfig = (this as any).component.rounding as RoundingConfig;
            
            if (roundingConfig && roundingConfig.enabled && value !== null && value !== undefined && value !== '') {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    const roundedValue = this.applyRounding(numValue);
                    return roundedValue.toFixed(roundingConfig.decimalPlaces || 2);
                }
            }
            
            const originalResult = super.getValueAsString(value, options);
            return String(originalResult);
        }
    };
}

// Apply the mixin to create the final component class
export default class Component extends WithRounding(ParentComponent as Constructor<FormioComponentMethods>) {
    constructor(component: any, options: any, data: any) {
        super(component, options, data); // NOSONAR - ParentComponent is a valid FormIO constructor
    }

    static schema(...extend: any[]) {
        const baseSchema = ParentComponent.schema({
            type: ID,
            label: DISPLAY,
            key: ID,
            validate: {
                min: '',
                max: '',
                step: 'any',
                integer: ''
            }
        }, ...extend);

        return addRoundingToSchema(baseSchema);
    }

    public static editForm = editForm;

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'simple',
            icon: 'hashtag',
            weight: 10,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema(),
        };
    }
}
