/**
 * Rounding functionality mixin for FormIO number components
 * 
 * This mixin implements a common JavaScript mixin pattern using object composition.
 * References:
 * - JavaScript Mixins: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
 * - TypeScript Mixins: https://www.typescriptlang.org/docs/handbook/mixins.html
 * - FormIO Component Extension Patterns: https://github.com/formio/formio.js/wiki/Custom-Components
 * 
 * The rounding logic addresses floating-point precision issues common in JavaScript:
 * - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON
 * - https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
 */
export interface RoundingConfig {
    enabled: boolean;
    method: 'round' | 'floor' | 'ceil';
    decimalPlaces: number;
}

export const RoundingMixin = {
    /**
     * Apply rounding to a numeric value based on component configuration
     */
    applyRounding(value: number): number {
        const roundingConfig = this.component.rounding as RoundingConfig;
        
        if (!roundingConfig || !roundingConfig.enabled) {
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
    },

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
    },

    /**
     * Override setValue to apply rounding
     */
    setValue(value: any, flags: any = {}) {
        const processedValue = this.processValueWithRounding(value);
        return this.constructor.prototype.setValue.call(this, processedValue, flags);
    },

    /**
     * Override getValue to apply rounding
     */
    getValue() {
        const value = this.constructor.prototype.getValue.call(this);
        return this.processValueWithRounding(value);
    },

    /**
     * Override calculateValue to apply rounding
     */
    calculateValue(data: any, flags: any, row: any) {
        const value = this.constructor.prototype.calculateValue.call(this, data, flags, row);
        return this.processValueWithRounding(value);
    },

    /**
     * Override getValueAsString for consistent display
     */
    getValueAsString(value: any, options: any) {
        const roundingConfig = this.component.rounding as RoundingConfig;
        
        if (roundingConfig && roundingConfig.enabled && value !== null && value !== undefined && value !== '') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                const roundedValue = this.applyRounding(numValue);
                return roundedValue.toFixed(roundingConfig.decimalPlaces || 2);
            }
        }
        
        return this.constructor.prototype.getValueAsString.call(this, value, options);
    }
};

// Add this to your Rounding.mixin.ts file
export const RoundingEditFormComponents = [
    {
        type: 'panel',
        title: 'Rounding',
        key: 'rounding-panel',
        weight: 100,
        customClass: 'mixin-top-margin',
        components: [
            {
                type: 'checkbox',
                key: 'rounding.enabled',
                label: 'Enable Rounding',
                tooltip: 'Enable automatic rounding of decimal values',
                input: true
            },
            {
                type: 'select',
                key: 'rounding.method',
                label: 'Rounding Method',
                data: {
                    values: [
                        { label: 'Round (standard)', value: 'round' },
                        { label: 'Floor (round down)', value: 'floor' },
                        { label: 'Ceiling (round up)', value: 'ceil' }
                    ]
                },
                defaultValue: 'round',
                input: true,
                conditional: {
                    show: true,
                    when: 'rounding.enabled',
                    eq: true
                }
            },
            {
                type: 'number',
                key: 'rounding.decimalPlaces',
                label: 'Decimal Places',
                defaultValue: 2,
                input: true,
                validate: {
                    min: 0,
                    max: 10,
                    integer: true
                },
                conditional: {
                    show: true,
                    when: 'rounding.enabled',
                    eq: true
                }
            }
        ]
    }
];

/**
 * Add rounding configuration to schema
 */
export function addRoundingToSchema(schema: any) {
    return {
        ...schema,
        rounding: {
            enabled: false,
            method: 'round' as const,
            decimalPlaces: 2
        }
    };
}