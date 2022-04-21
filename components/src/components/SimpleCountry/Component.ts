import {Components} from 'formiojs';
const ParentCompoenent = (Components as any).components.select
import { Constants } from '../Common/Constants';
import editForm from './Component.form';

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
        return {
          title: DISPLAY,
          icon: 'flag',
          group: 'simple',
          documentation: Constants.DEFAULT_HELP_LINK,
          weight: 30,
          schema: Component.schema()
        };
    }
}
