var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
/* tslint:disable */
import { Components } from 'formiojs';
var ParentComponent = Components.components.button;
import editForm from './Component.form';
var ID = 'simplebtnsubmit';
var DISPLAY = 'Submit Button';
var Component = /** @class */ (function (_super) {
    __extends(Component, _super);
    function Component() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Component.schema = function () {
        var extend = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            extend[_i] = arguments[_i];
        }
        return ParentComponent.schema.apply(ParentComponent, __spreadArrays([{
                type: ID,
                label: 'Submit',
                key: ID,
                size: 'md',
                leftIcon: '',
                rightIcon: '',
                block: false,
                action: 'submit',
                persistent: false,
                disableOnInvalid: false,
                theme: 'primary',
                dataGridLabel: true
            }], extend));
    };
    Object.defineProperty(Component, "builderInfo", {
        get: function () {
            return {
                title: DISPLAY,
                group: 'simple',
                icon: 'paper-plane',
                weight: 30,
                documentation: 'https://en.wikipedia.org/wiki/Special:Random',
                schema: Component.schema()
            };
        },
        enumerable: false,
        configurable: true
    });
    Component.editForm = editForm;
    return Component;
}(ParentComponent));
export default Component;
