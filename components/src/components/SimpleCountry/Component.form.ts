import baseEditForm from 'formiojs/components/_classes/component/Component.form';
import EditDisplay from './editForm/Component.edit.display';
import EditData from './editForm/Component.edit.data';
import DisplayExtension from './editForm/Component.edit.data.extension';

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
        ...DisplayExtension,
    ], ...extend);
}

