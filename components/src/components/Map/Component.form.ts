import baseEditForm from 'formiojs/components/_classes/component/Component.form';
import EditData from './editForm/Component.edit.data';
import EditDisplay from './editForm/Component.edit.display';
import AdvancedEditLogic from '../Common/Advanced.edit.logic';
export default function (...extend) {
  return baseEditForm(
    [
      EditDisplay,
      EditData,
      {
        key: 'display',
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
        key: 'api',
        components: [
          {
            key: 'tags',
            ignore: true,
          },
          {
            key: 'properties',
            ignore: true,
          },
        ],
      },
      {
        key: 'logic',
        components: AdvancedEditLogic,
      },
      {
        key: 'layout',
        ignore: true,
      },
    ],
    ...extend
  );
}
