import baseEditForm from 'formiojs/components/_classes/component/Component.form';

import EditDisplay from './editForm/Component.edit.display';
import EditData from './editForm/Component.edit.data';
import SimpleConditional from '../Common/Simple.edit.conditional';
import SimpleValidation from '../Common/Simple.edit.validation';

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
            key: 'api',
            ignore: true
        },
        {
            key: 'layout',
            ignore: true
        },
        {
            key: 'conditional',
            ignore: true
        },
        {
            key: 'validation',
            ignore: true
        },
        {
            key: 'logic',
            ignore: true
        },
        {
            label: 'Data',
            key: 'customData',
            weight: 10,
            components: EditData
        },
        {
            label: 'Validation',
            key: 'customValidation',
            weight: 20,
            components: SimpleValidation
        },
        {
            label: 'Conditional',
            key: 'customConditional',
            weight: 40,
            components: SimpleConditional
        }
    ], ...extend);
}
