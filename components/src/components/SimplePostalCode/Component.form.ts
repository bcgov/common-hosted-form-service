import baseEditForm from 'formiojs/components/_classes/component/Component.form';
import EditDisplay from './editForm/Component.edit.display';
import EditValidation from './editForm/Component.edit.validation';
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
           ignore:true
        },
          {
            key: 'logic',
            ignore: true,
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
        label: 'Validation',
        key: 'customValidation',
        weight: 10,
        components: EditValidation
    },
    ...FormExtension,
    ], ...extend); 
}
