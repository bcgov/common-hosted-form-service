import baseEditForm from 'formiojs/components/_classes/component/Component.form';
import EditDisplay from './editForm/Component.edit.display';
import FormExtension from '../Common/Component.edit.data.extension';

export default function(...extend) {
    return baseEditForm([
        EditDisplay,
        {
            key: 'display',
            components: EditDisplay,
          },

          {
            label: 'Data',
            key: 'customData',
           ignore:true
        },
    ...FormExtension,
    ], ...extend);
}
