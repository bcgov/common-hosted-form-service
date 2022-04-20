import baseEditForm from 'formiojs/components/_classes/component/Component.form';
import EditDisplay from './editForm/Component.edit.display';
import EditValidation from './editForm/Component.edit.validation';
import FormExtension from './editForm/Component.edit.form.extension';

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
            label: 'Data',
           ignore:true
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


