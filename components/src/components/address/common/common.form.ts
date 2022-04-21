import EditDisplay from '../common/Common.edit.display';
import EditData from '../../Common/simple.edit.select.data';
export default[
    {
        key: 'display',
        components: EditDisplay,
      },
      {
        label: 'Data',
        key: 'customData',
        weight: 10,
        components: EditData
    },
]
