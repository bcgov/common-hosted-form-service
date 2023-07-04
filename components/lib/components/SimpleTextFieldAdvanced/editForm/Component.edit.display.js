import common from '../../Common/Advanced.edit.display';
import { reArrangeComponents } from '../../Common/function';
var neededposition = [
    'label',
    'labelPosition',
    'labelWidth',
    'labelMargin',
    'placeholder',
    'description',
    'tooltip',
    'prefix',
    'suffix',
    'widget.type',
    'widget',
    'inputMask',
    'displayMask',
    'inputMaskPlaceholderChar',
    'allowMultipleMasks',
    'customClass',
    'tabindex',
    'autocomplete',
    'hidden',
    'hideLabel',
    'showWordCount',
    'showCharCount',
    'mask',
    'autofocus',
    'spellcheck',
    'disabled',
    'tableView',
    'modalEdit'
];
var newPosition = reArrangeComponents(neededposition, common);
export default newPosition;
