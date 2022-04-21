    import {Components} from 'formiojs';
    const ParentCompoenent = (Components as any).components.columns
    import builder from '../common/common.function';
    import editForm from './Component.form';
    import columns from './editForm/Columns';

    const ID = 'fieldsAddress';
    const DISPLAY = 'FieldsAddress';
    
    export default class Component extends (ParentCompoenent as any){
        static schema (...extend){
            return ParentCompoenent.schema({
              label: DISPLAY,
              type: ID,
              key: ID,
              clearOnHide: true,
              refreshOn: ID,
              redrawOn:ID,
              refreshOnChange:true,
              clearOnRefresh: true,
              tableView: true,
              persistent: false,
              autoAdjust: true,
              hideLabel: true,
              columns: columns 
            }, ...extend)
          }
          
        public static editForm = editForm;
        static get builderInfo() {
          return builder('globe',Component,60,DISPLAY);  
        };
    }
