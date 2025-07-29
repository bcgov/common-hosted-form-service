import baseEditForm from 'formiojs/components/number/Number.form';
import NumberEditDisplay from 'formiojs/components/number/editForm/Number.edit.display';
import EditValidation from './editForm/Component.edit.validation';
import { RoundingEditFormComponents } from '../Common/Rounding.mixin';

export default function(...extend) {
    return baseEditForm([
        {
            key: 'display',
            weight: 5,
            components: [
                ...NumberEditDisplay,
                ...RoundingEditFormComponents,
            ],
        },
        {
            key: 'validation',
            ignore: true
        },
        {
            label: 'Validation',
            key: 'customValidation',
            weight: 15,
            components: EditValidation
        },
    ], ...extend);
}
