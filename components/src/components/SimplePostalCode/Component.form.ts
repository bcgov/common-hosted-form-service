import baseEditForm from 'formiojs/components/_classes/component/Component.form';
import EditDisplay from './editForm/Component.edit.display';
import EditValidation from './editForm/Component.edit.validation';

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
           ignore:true
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
          label: 'API',
          ignore: true
      },
      {
          label: 'Conditional',
          ignore: true
      },
      {
        label: 'Validation',
        key: 'customValidation',
        weight: 10,
        components: EditValidation
    }
    ], ...extend);
  
}
