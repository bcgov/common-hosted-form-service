import common from '../../../Common/Simple.edit.display';
export default {
  key: 'display',
  components: [
    ...common,
    {
      key: 'className',
      ignore: true,
    },
    {
      key: 'attrs',
      ignore: true
    },
    {
      key: 'description',
      ignore:true,
    },
    {
      key: 'widget',
      ignore: true
    },
  ]
}
