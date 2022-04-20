import baseEditForm from 'formiojs/components/_classes/component/Component.form';
import EditDisplay from './editForm/Component.edit.display';
import FormExtension from '../Common/Component.edit.data.extension';
import EditData from '../Common/simple.edit.select.data';

export default function(...extend) {
    return baseEditForm([
        EditDisplay,
        {
          key: 'display',
          components: EditDisplay,
        },
        {
          key: 'data',
          ignore: true,
        },
        {
          key: 'validation',
          ignore: true,
        },
        {
          key: 'logic',
          ignore: true,
        },
        {
          key: 'addons',
          ignore: true
        },
        {
          label: 'Data',
          key: 'customData',
          weight: 10,
          components: EditData
      },
      
    ...FormExtension,
    ], ...extend);
}