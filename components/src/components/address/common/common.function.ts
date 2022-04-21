import { Constants } from '../../Common/Constants';

var builder =(iconName:string,Component:any,weight:number,displayName:string):any=>{
    return {
        title:displayName,
        icon: iconName,
        group: 'simple',
        documentation: Constants.DEFAULT_HELP_LINK,
        weight: weight,
        schema: Component.schema()
      };
}

export default builder;
