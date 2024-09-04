import baseEditForm from 'formiojs/components/_classes/component/Component.form';
import EditData from './editForm/Component.edit.data';
import AdvancedEditLogic from '../Common/Advanced.edit.logic';
export default function (...extend) {
  return baseEditForm(
    [
      {
        key: 'display',
        components: [
          {
            // You can ignore existing fields.
            key: 'placeholder',
            ignore: true,
          },
          {
            key: 'tableView',
            ignore: true,
          },
          {
            key: 'hidden',
            ignore: true,
          },
          {
            key: 'autofocus',
            ignore: true,
          },
          {
            key: 'tabindex',
            ignore: true,
          },
          {
            key: 'modalEdit',
            ignore: true,
          },
          {
            key: 'disabled',
            ignore: true,
          },
        ],
      },
      EditData,
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
