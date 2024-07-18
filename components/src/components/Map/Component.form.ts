import baseEditForm from 'formiojs/components/_classes/component/Component.form';
import EditData from './editForm/Component.edit.data';
import EditDisplay from './editForm/Component.edit.display';
import SimpleApi from '../Common/Simple.edit.api';
import SimpleConditional from '../Common/Simple.edit.conditional';
import AdvancedEditLogic from '../Common/Advanced.edit.logic';
import AdvancedEditLayout from '../Common/Advanced.edit.layout';
export default function (...extend) {
  return baseEditForm(
    [
      EditDisplay,
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
        components: AdvancedEditLayout,
      },
    ],
    ...extend
  );
}
