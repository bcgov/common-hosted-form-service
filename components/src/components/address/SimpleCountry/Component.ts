import {Components} from 'formiojs';
const ParentCompoenent = (Components as any).components.select
import editForm from './Component.form';
import builder from '../common/common.function';

const ID = 'country';
const DISPLAY = 'Country';

export default class Component extends (ParentCompoenent as any){

  static schema (...extend){
        return ParentCompoenent.schema({
          label: DISPLAY,
          key: ID,
          disabled:true,
          defaultValue:'Canada',
          type: 'select',
          input: true,
             
        }, ...extend)
    }

    public static editForm = editForm;
    static get builderInfo() {
      return builder('flag',Component,30,DISPLAY);
    };  
}
