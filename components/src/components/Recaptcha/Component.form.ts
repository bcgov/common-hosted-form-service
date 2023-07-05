import baseEditForm from 'formiojs/components/_classes/component/Component.form';
import ReCaptchaEditDisplay from '../Recaptcha/editForm/ReCaptcha.edit.providers';

export default function() {
  return baseEditForm([
    {
      key: 'display',
      components: ReCaptchaEditDisplay
    },
    {
      key: 'data',
      ignore: true
    },
    {
      key: 'validation',
      ignore: true
    },
    {
      key: 'conditional',
      ignore: true
    },
    {
      key: 'logic',
      ignore: true
    },
  ]);
}
