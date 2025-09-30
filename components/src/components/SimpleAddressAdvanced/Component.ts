/* tslint:disable */
import { Constants } from '../Common/Constants';
import {
  ShadowDOMAddressComponent,
  ShadowDOMAddressConfig,
} from '../Common/ShadowDOMAddressComponent';
import editForm from './Component.form';

const ID = 'simpleaddressadvanced';
const DISPLAY = 'Address';

export default class Component extends ShadowDOMAddressComponent {
  protected getConfig(): ShadowDOMAddressConfig {
    return {
      componentId: ID,
      displayName: DISPLAY,
      // No providerOptions or queryParameters - this is a generic address component
    };
  }

  static schema(...extend: any[]) {
    return ShadowDOMAddressComponent.createSchema(
      {
        componentId: ID,
        displayName: DISPLAY,
        // No provider configuration - user configures this themselves
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: DISPLAY,
      group: 'advanced',
      icon: 'home',
      weight: 770,
      documentation: Constants.DEFAULT_HELP_LINK,
      schema: Component.schema(),
    };
  }

  public static readonly editForm = editForm;
}
