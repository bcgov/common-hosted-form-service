import _widgets from 'formiojs/widgets';

export default [
      {
        weight: 10,
        type: 'textfield',
        input: true,
        key: 'label',
        label: 'Label',
        placeholder: 'Field Label',
        tooltip: 'The label for this field that will appear next to it.',
        validate: {
          required: true
        }
      }, {
        type: 'select',
        input: true,
        key: 'labelPosition',
        label: 'Label Position',
        tooltip: 'Position for the label for this field.',
        weight: 20,
        defaultValue: 'top',
        dataSrc: 'values',
        data: {
          values: [{
            label: 'Top',
            value: 'top'
          }, {
            label: 'Left (Left-aligned)',
            value: 'left-left'
          }, {
            label: 'Left (Right-aligned)',
            value: 'left-right'
          }, {
            label: 'Right (Left-aligned)',
            value: 'right-left'
          }, {
            label: 'Right (Right-aligned)',
            value: 'right-right'
          }, {
            label: 'Bottom',
            value: 'bottom'
          }]
        }
      }, {
        type: 'number',
        input: true,
        key: 'labelWidth',
        label: 'Label Width',
        tooltip: 'The width of label on line in percentages.',
        clearOnHide: false,
        weight: 30,
        placeholder: '30',
        suffix: '%',
        validate: {
          min: 0,
          max: 100
        },
        conditional: {
          json: {
            and: [{
              '!==': [{
                var: 'data.labelPosition'
              }, 'top']
            }, {
              '!==': [{
                var: 'data.labelPosition'
              }, 'bottom']
            }]
          }
        }
      }, {
        type: 'number',
        input: true,
        key: 'labelMargin',
        label: 'Label Margin',
        tooltip: 'The width of label margin on line in percentages.',
        clearOnHide: false,
        weight: 30,
        placeholder: '3',
        suffix: '%',
        validate: {
          min: 0,
          max: 100
        },
        conditional: {
          json: {
            and: [{
              '!==': [{
                var: 'data.labelPosition'
              }, 'top']
            }, {
              '!==': [{
                var: 'data.labelPosition'
              }, 'bottom']
            }]
          }
        }
      }, {
        weight: 100,
        type: 'textfield',
        input: true,
        key: 'placeholder',
        label: 'Placeholder',
        placeholder: 'Placeholder',
        tooltip: 'The placeholder text that will appear when this field is empty.'
      }, {
        weight: 200,
        type: 'textarea',
        input: true,
        key: 'description',
        label: 'Description',
        placeholder: 'Description for this field.',
        tooltip: 'The description is text that will appear below the input field.',
        editor: 'ace',
        as: 'html',
        wysiwyg: {
          minLines: 3,
          isUseWorkerDisabled: true
        }
      }, {
        weight: 300,
        type: 'textarea',
        input: true,
        key: 'tooltip',
        label: 'Tooltip',
        placeholder: 'To add a tooltip to this field, enter text here.',
        tooltip: 'Adds a tooltip to the side of this field.',
        editor: 'ace',
        as: 'html',
        wysiwyg: {
          minLines: 3,
          isUseWorkerDisabled: true
        }
      },
      {
        weight: 320,
        type: 'textfield',
        input: true,
        key: 'prefix',
        label: 'Prefix'
      }, {
        weight: 330,
        type: 'textfield',
        input: true,
        key: 'suffix',
        label: 'Suffix',
      },

      {
        weight: 400,
        type: 'select',
        input: true,
        key: 'widget.type',
        label: 'Widget',
        placeholder: 'Select a widget',
        tooltip: 'The widget is the display UI used to input the value of the field.',
        defaultValue: 'input',
       onChange(context) {
        context.data.widget = context.default.pick(context.data.widget, 'type');
      },
        dataSrc: 'values',
        data: {
          values: [{
            label: 'Input Field',
            value: 'input'
          }, {
            label: 'Calendar Picker',
            value: 'calendar'
          }]
        },
      },
      {
        weight: 405,
        type: 'textarea',
        key: 'widget',
        label: 'Widget Settings',
        refreshOn: 'wiget.type',
        clearOnHide: false,
        input: true,
        rows: 5,
        editor: 'ace',
        as: 'json',
        customConditional: function customConditional(context) {
            return context.data.widget.type !== 'input';
        }
      },
      {
        weight: 410,
        type: 'textfield',
        input: true,
        key: 'inputMask',
        label: 'Input Mask',
        tooltip: 'An input mask helps the user with input by ensuring a predefined format.<br><br>9: numeric<br>a: alphabetical<br>*: alphanumeric<br><br>Example telephone mask: (999) 999-9999<br><br>See the <a target=\'_blank\' href=\'https://github.com/RobinHerbots/jquery.inputmask\'>jquery.inputmask documentation</a> for more information.</a>',
        customConditional: function customConditional(context) {
          return !context.data.allowMultipleMasks;
        }
      },
      {
        weight: 410,
        type: 'textfield',
        input: true,
        key: 'displayMask',
        label: 'Display Mask',
        tooltip: 'A display mask helps to display the input in a readable way, this won\'t affect the  value which will be saved (to affect both view and saved value, delete Display Mask and use Input Mask).<br><br>9: numeric<br>a: alphabetical<br>*: alphanumeric<br><br>Example telephone mask: (999) 999-9999<br><br>See the <a target=\'_blank\' href=\'https://github.com/RobinHerbots/jquery.inputmask\'>jquery.inputmask documentation</a> for more information.</a>',
        customConditional: function customConditional(context) {
          return !context.data.allowMultipleMasks;
        }
      }, {
        weight: 411,
        type: 'textfield',
        input: true,
        key: 'inputMaskPlaceholderChar',
        label: 'Input Mask Placeholder Char',
        tooltip: 'You can specify a char which will be used as a placeholder in the field. <br>E.g., \u02CD<br>Make note that placeholder char will be replaced by a space if it is used inside the mask',
        validation: {
          maxLength: 1
        },
        customConditional: function customConditional(context) {
          return context.data.inputMask || context.data.displayMask;
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
        weight: 408,
        type: 'textfield',
        input: true,
        key: 'customClass',
        label: 'Custom CSS Class',
        placeholder: 'Custom CSS Class',
        tooltip: 'Custom CSS class to add to this component.'
      }, {
        weight: 600,
        type: 'textfield',
        input: true,
        key: 'tabindex',
        label: 'Tab Index',
        placeholder: '0',
        tooltip: 'Sets the tabindex attribute of this component to override the tab order of the form. See the <a href=\'https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex\'>MDN documentation</a> on tabindex for more information.'
      },
      {
        weight: 700,
        type: 'textfield',
        input: true,
        key: 'autocomplete',
        label: 'Autocomplete',
        placeholder: 'on',
        tooltip: 'Indicates whether input elements can by default have their values automatically completed by the browser. See the <a href=\'https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete\'>MDN documentation</a> on autocomplete for more information.'
      },
      {
        weight: 1100,
        type: 'checkbox',
        label: 'Hidden',
        tooltip: 'A hidden field is still a part of the form, but is hidden from view.',
        key: 'hidden',
        input: true
      }, {
        weight: 1200,
        type: 'checkbox',
        label: 'Hide Label',
        tooltip: 'Hide the label (title, if no label) of this component. This allows you to show the label in the form builder, but not when it is rendered.',
        key: 'hideLabel',
        input: true
      }, {
        weight: 1200,
        type: 'checkbox',
        label: 'Show Word Counter',
        tooltip: 'Show a live count of the number of words.',
        key: 'showWordCount',
        input: true
      }, {
        weight: 1201,
        type: 'checkbox',
        label: 'Show Character Counter',
        tooltip: 'Show a live count of the number of characters.',
        key: 'showCharCount',
        input: true
      },
      {
        weight: 1300,
        type: 'checkbox',
        label: 'Hide Input',
        tooltip: 'Hide the input in the browser. This does not encrypt on the server. Do not use for passwords.',
        key: 'mask',
        input: true
      },{
        weight: 1350,
        type: 'checkbox',
        label: 'Initial Focus',
        tooltip: 'Make this field the initially focused element on this form.',
        key: 'autofocus',
        input: true
      },  {
        weight: 1350,
        type: 'checkbox',
        input: true,
        key: 'spellcheck',
        defaultValue: true,
        label: 'Allow Spellcheck'
      },
      // {
      //   weight: 1370,
      //   type: 'checkbox',
      //   label: 'Show Label in DataGrid',
      //   tooltip: 'Show the label when in a Datagrid.',
      //   key: 'dataGridLabel',
      //   input: true,
      //   customConditional: function customConditional(context) {
      //     var _context$instance$opt, _context$instance$opt2;
      //     return (_context$instance$opt = context.instance.options) === null || _context$instance$opt === void 0 ? void 0 : (_context$instance$opt2 = _context$instance$opt.flags) === null || _context$instance$opt2 === void 0 ? void 0 : _context$instance$opt2.inDataGrid;
      //   }
      // },
      {
        weight: 1400,
        type: 'checkbox',
        label: 'Disabled',
        tooltip: 'Disable the form input.',
        key: 'disabled',
        input: true
      }, {
        weight: 1500,
        type: 'checkbox',
        label: 'Table View',
        tooltip: 'Shows this value within the table view of the submissions.',
        key: 'tableView',
        input: true
      }, {
        weight: 1600,
        type: 'checkbox',
        label: 'Modal Edit',
        tooltip: 'Opens up a modal to edit the value of this component.',
        key: 'modalEdit',
        input: true
      }, {
        type: 'number',
        input: true,
        key: 'rows',
        label: 'Rows',
        weight: 210,
        tooltip: 'This allows control over how many rows are visible in the text area.',
        placeholder: 'Enter the amount of rows'
      }, {
        type: 'checkbox',
        input: true,
        key: 'autoExpand',
        label: 'Auto Expand',
        tooltip: 'This will make the TextArea auto expand it\'s height as the user is typing into the area.',
        weight: 415
      }, {
        type: 'select',
        input: true,
        key: 'editor',
        label: 'Editor',
        tooltip: 'Select the type of WYSIWYG editor to use for this text area.',
        dataSrc: 'values',
        data: {
          values: [{
            label: 'None',
            value: ''
          }, {
            label: 'ACE',
            value: 'ace'
          }, {
            label: 'CKEditor',
            value: 'ckeditor'
          }, {
            label: 'Quill',
            value: 'quill'
          }]
        },
        weight: 415
      },
    ];
