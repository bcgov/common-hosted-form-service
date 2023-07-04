var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
/* tslint:disable */
import { Components } from 'formiojs';
var ParentComponent = Components.components.datetime;
import editForm from './Component.form';
import { Constants } from '../Common/Constants';
var ID = 'simpledatetime';
var DISPLAY = 'Date / Time';
var Component = /** @class */ (function (_super) {
    __extends(Component, _super);
    function Component(component, options, data) {
        var _this = _super.call(this, component, options, data) || this;
        // if enableTime is set to false, manually add time fields since it get removed later on through Form IO
        if (!_this.component.enableTime) {
            _this.component.format = _this.component.format.concat(' hh:mm a');
        }
        return _this;
    }
    Component.schema = function () {
        var extend = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            extend[_i] = arguments[_i];
        }
        return ParentComponent.schema.apply(ParentComponent, __spreadArray([{
                type: ID,
                label: DISPLAY,
                key: ID,
                format: 'yyyy-MM-dd hh:mm a',
                useLocaleSettings: false,
                allowInput: true,
                enableDate: true,
                enableTime: false,
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
                    maxDate: null,
                },
                timePicker: {
                    hourStep: 1,
                    minuteStep: 1,
                    showMeridian: true,
                    readonlyInput: false,
                    mousewheel: true,
                    arrowkeys: true,
                },
                customOptions: {},
            }], extend, false));
    };
    Object.defineProperty(Component, "builderInfo", {
        get: function () {
            return {
                title: DISPLAY,
                group: 'simple',
                icon: 'calendar',
                weight: 20,
                documentation: Constants.DEFAULT_HELP_LINK,
                schema: Component.schema(),
            };
        },
        enumerable: false,
        configurable: true
    });
    Component.editForm = editForm;
    return Component;
}(ParentComponent));
export default Component;
