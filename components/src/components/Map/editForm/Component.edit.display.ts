import common from '../../Common/Simple.edit.display';
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
      {
        key: 'prefix',
        ignore: true
      },
      {
        key: 'suffix',
        ignore: true
      },
      {
        weight: 410,
        type: 'textfield',
        input: true,
        key: 'inputMask',
        label: 'Input Mask',
        tooltip: 'An input mask helps the user with input by ensuring a predefined format.<br><br>9: numeric<br>a: alphabetical<br>*: alphanumeric<br><br>Example telephone mask: (999) 999-9999<br><br>See the <a target=\'_blank\' href=\'https://github.com/RobinHerbots/jquery.inputmask\'>jquery.inputmask documentation</a> for more information.</a>',
        customConditional(context) {
          return !context.data.allowMultipleMasks;
        }
      },
      {
        weight: 413,
        type: 'checkbox',
        input: true,
        key: 'allowMultipleMasks',
        label: 'Allow Multiple Masks'
      },
      {
        weight: 1350,
        type: 'checkbox',
        input: true,
        key: 'spellcheck',
        defaultValue: true,
        label: 'Allow Spellcheck'
      },
      {
        weight: 417,
        type: 'datagrid',
        input: true,
        key: 'inputMasks',
        label: 'Input Masks',
        customConditional(context) {
          return context.data.allowMultipleMasks === true;
        },
        reorder: true,
        components: [
          {
            type: 'textfield',
            key: 'label',
            label: 'Label',
            input: true
          },
          {
            type: 'textfield',
            key: 'mask',
            label: 'Mask',
            input: true
          }
        ]
      },
      {
        key: 'autocomplete',
        ignore: true,
      },
      {
        weight: 1300,
        key: 'mask',
        ignore: true
      },
      {
        weight: 1200,
        type: 'checkbox',
        label: 'Show Word Counter',
        tooltip: 'Show a live count of the number of words.',
        key: 'showWordCount',
        input: true
      },
      {
        weight: 1201,
        type: 'checkbox',
        label: 'Show Character Counter',
        tooltip: 'Show a live count of the number of characters.',
        key: 'showCharCount',
        input: true
      }
    ]
  }
