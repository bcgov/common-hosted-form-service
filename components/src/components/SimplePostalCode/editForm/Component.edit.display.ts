import common from '../../Common/Simple.edit.display';
import textfieldData from '../../Common/simple.texfield.data';

export default
  {
    key: 'display',
    components: [
      ...common,
      {
        key: 'refreshOnChange',
        ignore: true
      },
      {
        key: 'className',
        ignore: true,
      },
      {
        key: 'widget',
        ignore: true
      },
      {
        key: 'widget.type',
        ignore: true
      },
      textfieldData 
    ]
  }
