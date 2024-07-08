import baseEditForm from 'formiojs/components/_classes/component/Component.form';
import EditData from './editForm/Component.edit.data';
import EditDisplay from './editForm/Component.edit.display';
import EditValidation from './editForm/Component.edit.validation';
import SimpleApi from '../Common/Simple.edit.api';
import SimpleConditional from '../Common/Simple.edit.conditional';
export default function (...extend) {
  return baseEditForm(
    [
      EditDisplay,
      {
        key: 'data',
        ignore: true,
      },
      EditData,
      {
        key: 'api',
        ignore: true,
      },
      {
        key: 'layout',
        ignore: true,
      },
      {
        key: 'conditional',
        ignore: true,
      },
      {
        key: 'logic',
        ignore: true,
      },
      {
        key: 'validation',
        ignore: true,
      },
      {
        label: 'API',
        key: 'customAPI',
        weight: 30,
        components: SimpleApi,
      },
      {
        label: 'Conditional',
        key: 'customConditional',
        weight: 40,
        components: SimpleConditional,
      },
    ],
    ...extend
  );
}
