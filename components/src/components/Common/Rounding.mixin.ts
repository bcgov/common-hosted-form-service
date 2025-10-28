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
    method: 'round' | 'floor' | 'ceil';
}

// Add this to your Rounding.mixin.ts file
export const RoundingEditFormComponents = [
    {
        type: 'fieldset',
        title: 'Number Precision & Rounding',
        key: 'precision-fieldset',
        components: [
            {
                type: 'checkbox',
                key: 'requireDecimal',
                label: 'Require Decimal',
                tooltip: 'Always show decimals, even if trailing zeros.',
                input: true,
                weight: 100,
                defaultValue: false
            },
            {
                type: 'number',
                input: true,
                weight: 80,
                key: 'decimalLimit',
                label: 'Decimal Places',
                tooltip: 'The maximum number of decimal places',
                validate: {
                    integer: true,
                },
                conditional: {
                    show: true,
                    when: 'requireDecimal',
                    eq: true
                },
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
                weight: 101,
                conditional: {
                    show: true,
                    when: 'requireDecimal',
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
            method: 'round' as const,
        }
    };
}