import baseEditForm from 'formiojs/components/_classes/component/Component.form';

import EditData from './editForm/Orgbook.edit.data';
import EditDisplay from './editForm/Orgbook.edit.display';
import EditValidation from './editForm/Orgbook.edit.validation';

export default function(...extend) {
    return baseEditForm([
        {
            key: 'display',
            components: EditDisplay
        },
        {
            key: 'data',
            components: EditData
        },
        {
            key: 'validation',
            components: EditValidation
        }
    ], ...extend);
}
