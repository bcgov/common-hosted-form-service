/* tslint:disable */
import { Constants } from '../Common/Constants';
import {
  ShadowDOMAddressComponent,
  ShadowDOMAddressConfig,
} from '../Common/ShadowDOMAddressComponent';
import editForm from './Component.form';

const ID = 'simplebcaddress';
const DISPLAY = 'Simple BC Address';

export default class Component extends ShadowDOMAddressComponent {
  protected getConfig(): ShadowDOMAddressConfig {
    return {
      componentId: ID,
      displayName: DISPLAY,
    };
  }

  static schema(...extend: any[]) {
    return ShadowDOMAddressComponent.createSchema(
      {
        componentId: ID,
        displayName: DISPLAY,
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: DISPLAY,
      group: 'advanced',
      icon: 'address-book',
      weight: 90,
      documentation: Constants.DEFAULT_HELP_LINK,
      schema: Component.schema(),
    };
  }

  public static readonly editForm = editForm;
}
