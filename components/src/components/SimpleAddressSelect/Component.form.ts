import baseEditForm from 'formiojs/components/_classes/component/Component.form';
import EditDisplay from './editForm/Component.edit.display';

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
        ignore: true
    },
    ], ...extend);
}
