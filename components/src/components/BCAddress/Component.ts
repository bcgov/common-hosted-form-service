
/* tslint:disable */
import {Components, Formio} from 'formiojs';
import { Constants } from '../Common/Constants';
import editForm from './Component.form';
import _ from 'lodash';
import autocompleter from 'autocompleter';
export const AddressComponentMode = {
  Autocomplete: 'autocomplete',
  Manual: 'manual',
};

const ParentComponent = (Components as any).components.address;

const ID = 'bcaddress';
const DISPLAY = 'BC Address';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {

        return ParentComponent.schema({
            label: DISPLAY,
            type: ID,
            key: ID,
            provider: "custom",
            url:process.env.VUE_APP_BC_GEO_ADDRESS_APIURL,
            queryProperty:"addressString",
            responseProperty:"features",
            displayValueProperty:"properties.fullAddress",
            queryParameters:{"echo": false,
            "brief": true,
            "minScore": 55,
            "onlyCivic": true,
            "maxResults": 15,
            "autocomplete": true,
            "matchAccuracy": 100,
            "matchPrecision": "occupant, unit, site, civic_number, intersection, block, street, locality, province",
            "precisionPoints": 100,}

        }, ...extend);
    }

    static get builderInfo() {
        return {
            title: DISPLAY,
            group: 'advanced',
            icon: 'address-book',
            weight: 90,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }

    public static editForm = editForm;

    async init(){
        super.init();
    }

    async attach(element) {
        super.attach(element);
        try {
            console.log(this.builderMode,this.manualMode);
            this.searchInput.forEach((element, index) => {
                autocompleter({
                input: element,
                debounceWaitMs: 300,
                fetch: (text, update) => {
                  const query = text;
                  this.makeRequestChefsURL(query).then(update);
                },
                render: (address) => {
                    console.log("I am in render", address);
                  const div = this.ce('div');
                  div.textContent = this.getDisplayValues(address);
                  return div;
                },
                onSelect: (address) => {
                    console.log("I am in onSelect", address);
                  this.onSelectAddress(address, element, index);
                },
              });
            });
        } catch (err) {
            console.log(`This error is from Custom BC Address component in form.io: Failed to acquire configuration: ${err.message}`);
        }
    }

    onSelectAddress(address, element, index) {
        if (this.isMultiple) {
          this.address[index] = address;
          this.address = [...this.address];
        }
        else {
          this.address = address;
        }

        this.triggerChange({
          modified: true,
        });

        if (element) {
            console.log("-------------->>>>>>",this.getDisplayValue(this.isMultiple ? this.address[index] : this.address));
          element.value = this.getDisplayValue(this.isMultiple ? this.address[index] : this.address);
        }

        this.updateRemoveIcon(index);
      }

    getDisplayValue(address) {
        let {
            displayValueProperty,
        } = this.component;
        return displayValueProperty ? _.get(address, displayValueProperty, '') : String(address);
      }

      getDisplayValues(value = this.address) {
        let {
            provider,
        } = this.component;
        return (provider && !this.manualMode)
          ? this.getDisplayValue(value)
          : '';
      }

    makeRequestChefsURL(query) {
        let {
            url,
            queryProperty,
            responseProperty,
            displayValueProperty,
            queryParameters,
        } = this.component;
        const requestOptions={url:url,queryProperty:{[queryProperty]:query},responseProperty:responseProperty, displayValueProperty:displayValueProperty, queryParameters:queryParameters};
        return Formio.makeStaticRequest("http://localhost:8080/app/api/v1/bcgeoaddress/address", "Post", requestOptions,null).then((result) => {
        return responseProperty ? _.get(result, responseProperty, []) : result});
      }
}
export {};
