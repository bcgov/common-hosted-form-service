import baseEditForm from 'formiojs/components/_classes/component/Component.form';

import EditDisplay from './editForm/Component.edit.display';

export default function(...extend) {
    return baseEditForm([
        {
            key: 'display',
            components: EditDisplay

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
        }
    ], ...extend);
}
