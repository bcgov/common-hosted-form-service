/**
  * To load data
    *  A. open command prompt, then cd to this folder countrydataserver
    *  B. then enter node server.js
  * To add more data to cities or make any changes
    *  A. go to countrydataserver folder
    *  B. go to data folder
*/

import {Components} from 'formiojs';
const ParentCompoenent = (Components as any).components.select
import { Constants } from '../Common/Constants';
import editForm from './Component.form';

const ID = 'province';
const DISPLAY = 'Province';

export default class Component extends (ParentCompoenent as any){

    static schema (...extend){
        return ParentCompoenent.schema({
          label: DISPLAY,
          type: 'select',
          key: ID,
          clearOnHide: true,
          tableView: true,
          persistent: false,
          autoAdjust: true,
          hideLabel: true, 
        template: '<span>{{ item.value }}</span>',
        data: {
          url:'https://timisenco2015.github.io/common-hosted-form-service_data/data/provinces.json'
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
          icon: 'fort-awesome',
          group: 'simple',
          documentation: Constants.DEFAULT_HELP_LINK,
          weight: 40,
          schema: Component.schema()
        };
    }
}
