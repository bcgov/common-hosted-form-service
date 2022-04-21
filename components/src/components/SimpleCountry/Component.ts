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
            type: ID,
            key: ID,
            clearOnHide: true,
            tableView: true,
            persistent: false,
            autoAdjust: true,
            hideLabel: true,
            template: '<span>{{ item.value }}</span>',
            disabled:true,
            defaultValue:'Canada',
            input: true,
            limit: -1,
          }, ...extend)
        
      }

      public static editForm = editForm;
      static get builderInfo() {
          return {
            title: DISPLAY,
            icon: 'flag',
            group: 'simple',
            documentation: Constants.DEFAULT_HELP_LINK,
            weight: 50,
          
            schema: Component.schema()
          };
      }
  }
