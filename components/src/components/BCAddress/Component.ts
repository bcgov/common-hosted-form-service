/* tslint:disable */
import { Components } from 'formiojs';
import { Constants } from '../Common/Constants';
import editForm from './Component.form';
import _ from 'lodash';

export const AddressComponentMode = {
  Autocomplete: 'autocomplete',
  Manual: 'manual',
};

const ParentComponent = (Components as any).components.address;

const ID = 'bcaddress';
const DISPLAY = 'BC Address';

export default class Component extends (ParentComponent as any) {
  static schema(...extend) {
    return ParentComponent.schema(
      {
        label: DISPLAY,
        type: ID,
        key: ID,
        provider: 'custom',
        providerOptions: {
          queryProperty: 'addressString',
          url: import.meta.env.VITE_CHEFS_GEO_ADDRESS_APIURL,
        },

        queryParameters: {
          echo: false,
          brief: true,
          minScore: 55,
          onlyCivic: true,
          maxResults: 15,
          autocomplete: true,
          matchAccuracy: 100,
          matchPrecision:
            'occupant, unit, site, civic_number, intersection, block, street, locality, province',
          precisionPoints: 100,
        },
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

  mergeSchema(component = {}) {
    let components = component['components'];

    if (components) {
      return _.omit(component, 'components');
    }

    return component;
  }

  public static editForm = editForm;

  async init() {
    super.init();
  }

  async attach(element) {
    super.attach(element);
    try {
      let { providerOptions, queryParameters } = this.component;
      if (providerOptions) {
        if (!providerOptions.params) {
          providerOptions['params'] = {};
        }
        if (queryParameters) {
          providerOptions.params = {
            ...providerOptions.params,
            ...queryParameters,
          };
        }
      }
    } catch (err) {
      console.log(
        `This error is from Custom BC Address component in form.io: Failed to acquire configuration: ${err.message}`
      );
    }
  }
}
export {};
