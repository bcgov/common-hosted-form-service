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