import {Components} from 'formiojs';
const ParentCompoenent = (Components as any).components.select
import editForm from './Component.form';
import builder from '../common/common.function';

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
      return builder('building',Component,40,DISPLAY);
    }
}
