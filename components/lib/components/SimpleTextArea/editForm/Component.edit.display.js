var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import common from '../../Common/Simple.edit.display';
export default {
    key: 'display',
    components: __spreadArray(__spreadArray([], common, true), [
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
            key: 'mask',
            ignore: true
        },
        {
            type: 'number',
            input: true,
            key: 'rows',
            label: 'Rows',
            weight: 210,
            tooltip: 'This allows control over how many rows are visible in the text area.',
            placeholder: 'Enter the amount of rows'
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
            key: 'editor',
            ignore: true
        },
        {
            type: 'checkbox',
            input: true,
            key: 'autoExpand',
            label: 'Auto Expand',
            tooltip: 'This will make the TextArea auto expand it\'s height as the user is typing into the area.',
            weight: 415
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
        },
        {
            key: 'isUploadEnabled',
            ignore: true
        },
        {
            key: 'uploadStorage',
            ignore: true
        },
        {
            key: 'uploadUrl',
            ignore: true
        },
        {
            key: 'uploadOptions',
            ignore: true
        },
        {
            key: 'uploadDir',
            ignore: true
        },
        {
            key: 'fileKey',
            ignore: true
        },
        {
            key: 'as',
            ignore: true
        },
        {
            key: 'wysiwyg',
            ignore: true
        }
    ], false)
};
