var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import common from '../../Common/Simple.edit.validation';
export default __spreadArray(__spreadArray([], common, true), [
    {
        weight: 10,
        type: 'checkbox',
        label: 'Require Month',
        tooltip: 'A required field must be filled in before the form can be submitted.',
        key: 'fields.month.required',
        input: true
    },
    {
        weight: 0,
        type: 'checkbox',
        label: 'Require Day',
        tooltip: 'A required field must be filled in before the form can be submitted.',
        key: 'fields.day.required',
        input: true
    },
    {
        weight: 20,
        type: 'checkbox',
        label: 'Require Year',
        tooltip: 'A required field must be filled in before the form can be submitted.',
        key: 'fields.year.required',
        input: true
    },
    {
        weight: 40,
        type: 'textfield',
        label: 'Minimum Day',
        placeholder: 'yyyy-MM-dd',
        tooltip: 'A minimum date that can be set. You can also use Moment.js functions. For example: \n \n moment().subtract(10, \'days\')',
        key: 'minDate',
        input: true,
    },
    {
        weight: 30,
        type: 'textfield',
        label: 'Maximum Day',
        placeholder: 'yyyy-MM-dd',
        tooltip: 'A maximum day that can be set. You can also use Moment.js functions. For example: \n \n moment().add(10, \'days\')',
        key: 'maxDate',
        input: true,
    },
], false);
