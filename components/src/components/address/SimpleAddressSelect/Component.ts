    import {Components} from 'formiojs';
    const ParentCompoenent = (Components as any).components.columns
    import { Constants } from '../../Common/Constants';
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
            return {
              title: DISPLAY,
              icon: 'globe',
              group: 'simple',
              documentation: Constants.DEFAULT_HELP_LINK,
              weight: 60,
              schema: Component.schema()
            };
        }
    }
