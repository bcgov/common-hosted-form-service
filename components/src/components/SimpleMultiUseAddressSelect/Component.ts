import {Components} from 'formiojs';
const ParentCompoenent = (Components as any).components.select
import { Constants } from '../Common/Constants';
import editForm from './Component.form';

const ID = 'multiuseaddrselect';
const DISPLAY = 'MultiUseAddrselect';

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
