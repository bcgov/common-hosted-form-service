import {Components} from 'formiojs';
const ParentCompoenent = (Components as any).components.select
import { Constants } from '../Common/Constants';
import editForm from './Component.form';

const ID = 'city';
const DISPLAY = 'City';

export default class Component extends (ParentCompoenent as any){

  static schema (...extend){
        return ParentCompoenent.schema({
          label: DISPLAY,
          type: ID,
          key: ID,
          clearOnHide: true,
          tableView: true,
          persistent: false,
          autoAdjust: true,
          hideLabel: true, 
        template: '<span>{{ item.value }}</span>',
        data: {
          url:'https://timisenco2015.github.io/common-hosted-form-service_data/data/citiesandtowns.json'
        },
          clearOnRefresh: false,
          limit: 100,
         
        validate: {
          required: true
        },
        dataSrc: 'url',       
        }, ...extend)
    }

    public static editForm = editForm;
    static get builderInfo() {
        return {
          title: DISPLAY,
          icon: 'building',
          group: 'simple',
          documentation: Constants.DEFAULT_HELP_LINK,
          weight: 30,
          schema: Component.schema()
        };
    }
}
