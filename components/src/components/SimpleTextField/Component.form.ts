import baseEditForm from 'formiojs/components/_classes/component/Component.form';

import EditDisplay from './editForm/Component.edit.display';
import EditData from './editForm/Component.edit.data';
import EditValidation from './editForm/Component.edit.validation';
import SimpleConditional from '../Common/Simple.edit.conditional';

export default function(...extend) {
    return baseEditForm([
        {
            key: 'display',
            components: EditDisplay
        },
        {
            key: 'data',
            ignore: true,
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
            components: EditValidation
        },
        {
            label: 'Conditional',
            key: 'customConditional',
            weight: 40,
            components: SimpleConditional
        }
    ], ...extend);
}
