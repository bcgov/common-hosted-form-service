import baseEditForm from 'formiojs/components/number/Number.form';

import AdvancedEditDisplay from '../Common/Advanced.edit.display';
import AdvancedEditData from '../Common/Advanced.edit.data';
import EditValidation from './editForm/Component.edit.validation';
import { RoundingEditFormComponents } from '../Common/Rounding.mixin';

export default function (...extend) {
  return baseEditForm(
    [
      {
        key: 'display',
        ignore: true,
      },
      {
        label: 'Display',
        key: 'customDisplay',
        weight: 0,
        components: [...AdvancedEditDisplay],
      },
      {
        key: 'data',
        ignore: true,
      },
      {
        label: 'Data',
        key: 'customData',
        weight: 5,
        components: [...AdvancedEditData, ...RoundingEditFormComponents],
      },
      {
        key: 'validation',
        ignore: true,
      },
      {
        label: 'Validation',
        key: 'customValidation',
        weight: 15,
        components: EditValidation,
      },
    ],
    ...extend
  );
}
