var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
import baseEditForm from 'formiojs/components/_classes/component/Component.form';
import EditDisplay from './editForm/Component.edit.display';
import SimpleApi from '../Common/Simple.edit.api';
import SimpleConditional from '../Common/Simple.edit.conditional';
export default function () {
    var extend = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        extend[_i] = arguments[_i];
    }
    return baseEditForm.apply(void 0, __spreadArrays([[
            {
                key: 'display',
                components: EditDisplay
            },
            {
                key: 'data',
                ignore: true,
            },
            {
                key: 'api',
                ignore: true
            },
            {
                key: 'layout',
                ignore: true
            },
            {
                key: 'conditional',
                ignore: true
            },
            {
                key: 'validation',
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
        ]], extend));
}
