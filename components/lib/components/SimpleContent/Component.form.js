var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import baseEditForm from 'formiojs/components/_classes/component/Component.form';
import SimpleApi from '../Common/Simple.edit.api';
import SimpleConditional from '../Common/Simple.edit.conditional';
export default function () {
    var extend = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        extend[_i] = arguments[_i];
    }
    var editForm = baseEditForm.apply(void 0, __spreadArray([[
            {
                key: 'display',
                ignore: true
            },
            {
                key: 'data',
                ignore: true
            },
            {
                key: 'validation',
                ignore: true
            },
            {
                key: 'api',
                ignore: true
            },
            {
                key: 'conditional',
                ignore: true
            },
            {
                key: 'layout',
                ignore: true
            },
            {
                key: 'logic',
                ignore: true
            },
            {
                label: 'API',
                key: 'customAPI',
                weight: 30,
                components: SimpleApi
            },
            {
                label: 'Conditional',
                key: 'customConditional',
                weight: 40,
                components: SimpleConditional
            }
        ]], extend, false));
    // Add content as full width above the settings.
    editForm.components = [{
            weight: 0,
            type: 'textarea',
            editor: 'ckeditor',
            label: 'Content',
            hideLabel: true,
            input: true,
            key: 'html',
            as: 'html',
            rows: 3,
            tooltip: 'The HTML template for the result data items.',
        }].concat(editForm.components);
    return editForm;
}
