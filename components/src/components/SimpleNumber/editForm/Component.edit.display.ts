import common from '../../Common/Simple.edit.display';
export default {
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
      key: 'prefix',
      ignore: true
    },
    {
      key: 'suffix',
      ignore: true
    },
    {
      key: 'inputMask',
      ignore: true
    },
    {
      key: 'allowMultipleMasks',
      ignore: true
    },
    {
      key: 'showWordCount',
      ignore: true,
    },
    {
      key: 'showCharCount',
      ignore: true,
    },
  ]
}
