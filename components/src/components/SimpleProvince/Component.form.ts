import baseEditForm from 'formiojs/components/_classes/component/Component.form';
import EditDisplay from './editForm/Component.edit.display';
import EditData from './editForm/Component.edit.data';

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
            key: 'customData',
            weight: 10,
            components: EditData
        },
          {
            key: 'addons',
            ignore: true
          },
          {
            label: 'Data',
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
      label: 'API',
      ignore: true
  },
  {
    label: 'Conditional',
    ignore: true
},
    ], ...extend);
}