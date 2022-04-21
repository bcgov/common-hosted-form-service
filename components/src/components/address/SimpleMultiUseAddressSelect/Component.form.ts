import baseEditForm from 'formiojs/components/_classes/component/Component.form';
import CommonForm from '../common/common.form'
import FormExtension from '../../Common/Component.edit.data.extension';

export default function(...extend) {
    return baseEditForm([
      ...CommonForm,
      ...FormExtension,
    ], ...extend);
}
