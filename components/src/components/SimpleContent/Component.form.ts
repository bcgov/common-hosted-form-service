import baseEditForm from 'formiojs/components/_classes/component/Component.form';

import SimpleApi from '../Common/Simple.edit.api';
import SimpleConditional from '../Common/Simple.edit.conditional';

export default function(...extend) {
    const editForm = baseEditForm([
        {
            key: 'display',
            ignore: true
        },
        {
            key: 'data',
            ignore: true
        },
        {
            key: 'validation',
            ignore: true
        },
        {
            key: 'api',
            ignore: true
        },
        {
            key: 'conditional',
            ignore: true
        },
        {
            key: 'layout',
            ignore: true
        },
        {
            key: 'logic',
            ignore: true
        },
        {
            label: 'API',
            key: 'customAPI',
            weight: 30,
            components: SimpleApi
        },
        {
            label: 'Conditional',
            key: 'customConditional',
            weight: 40,
            components: SimpleConditional
        }
    ], ...extend);
    // Add content as full width above the settings.
    editForm.components = [{
        weight: 0,
        type: 'textarea',
        editor: 'ckeditor',
        label: 'Content',
        hideLabel: true,
        input: true,
        key: 'html',
        as: 'html',
        rows: 3,
        tooltip: 'The HTML template for the result data items.',
    }].concat(editForm.components);
    return editForm;
}
