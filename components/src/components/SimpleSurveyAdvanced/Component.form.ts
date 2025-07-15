import baseEditForm from 'formiojs/components/survey/Survey.form';
import EditValidation from './editForm/Component.edit.validation';

export default function(...extend) {
    return baseEditForm([
        {
            key: 'validation',
            ignore: true
        },
        {
            label: 'Validation',
            key: 'customValidation',
            weight: 15,
            components: EditValidation
        }
    ], ...extend);
}
