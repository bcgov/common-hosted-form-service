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
var ParentComponent = Components.components.htmlelement;
import editForm from './SimpleHeading.form';
var OrgBook = /** @class */ (function (_super) {
    __extends(OrgBook, _super);
    function OrgBook() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    OrgBook.schema = function () {
        var extend = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            extend[_i] = arguments[_i];
        }
        return ParentComponent.schema.apply(ParentComponent, __spreadArrays([{
                type: 'simpleheading',
                label: 'Heading',
                key: 'simpleheading',
                tag: 'h1',
                headingSize: 'h1',
                attrs: [],
                content: '',
                input: false,
                persistent: false
            }], extend));
    };
    Object.defineProperty(OrgBook, "builderInfo", {
        get: function () {
            return {
                title: 'Heading',
                group: 'simple',
                icon: 'code',
                weight: 70,
                documentation: 'http://help.form.io/userguide/#html-element-component',
                schema: OrgBook.schema()
            };
        },
        enumerable: false,
        configurable: true
    });
    OrgBook.editForm = editForm;
    return OrgBook;
}(ParentComponent));
export default OrgBook;
