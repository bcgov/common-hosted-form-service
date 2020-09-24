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
var ParentComponent = Components.components.datetime;
import editForm from './Component.form';
var ID = 'simpledatetime';
var DISPLAY = 'Date / Time';
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
                label: DISPLAY,
                key: ID,
                format: 'yyyy-MM-dd hh:mm a',
                useLocaleSettings: false,
                allowInput: true,
                enableDate: true,
                enableTime: true,
                defaultValue: '',
                defaultDate: '',
                displayInTimezone: 'viewer',
                timezone: '',
                datepickerMode: 'day',
                datePicker: {
                    showWeeks: true,
                    startingDay: 0,
                    initDate: '',
                    minMode: 'day',
                    maxMode: 'year',
                    yearRows: 4,
                    yearColumns: 5,
                    minDate: null,
                    maxDate: null
                },
                timePicker: {
                    hourStep: 1,
                    minuteStep: 1,
                    showMeridian: true,
                    readonlyInput: false,
                    mousewheel: true,
                    arrowkeys: true
                },
                customOptions: {},
            }], extend));
    };
    Object.defineProperty(Component, "builderInfo", {
        get: function () {
            return {
                title: DISPLAY,
                group: 'simple',
                icon: 'calendar',
                weight: 20,
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
