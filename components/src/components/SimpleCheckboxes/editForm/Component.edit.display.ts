import common from '../../Common/Simple.edit.display';
export default {
  key: 'display',
  components:
  [
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
          key: 'attrs',
          ignore: true
      },
      {
          key: 'widget',
          ignore: true
      },
      {
          key: 'uniqueOptions',
          ignore: true
      },
  ]
}
