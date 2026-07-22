/* tslint:disable */
import SimpleNumberComponent from '../SimpleNumber/Component';
import editForm from './Component.form';
import { Constants } from '../Common/Constants';

const ID = 'simplenumberadvanced';
const DISPLAY = 'Number';

export default class Component extends SimpleNumberComponent {
  static schema(...extend: any[]) {
    return super.schema(
      {
        type: ID,
        label: DISPLAY,
        key: ID,
      },
      ...extend
    );
  }

  public static readonly editForm = editForm;

  static get builderInfo() {
    return {
      title: DISPLAY,
      group: 'advanced',
      icon: 'hashtag',
      weight: 750,
      documentation: Constants.DEFAULT_HELP_LINK,
      schema: Component.schema(),
    };
  }
}
