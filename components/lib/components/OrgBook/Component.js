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
var SelectComponent = Components.components.select;
import editForm from './Component.form';
import { Constants } from '../Common/Constants';
var ID = 'orgbook';
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
        return SelectComponent.schema.apply(SelectComponent, __spreadArray([{
                type: ID,
                label: 'Registered Business Name',
                key: ID,
                idPath: 'id',
                dataSrc: 'url',
                data: {
                    values: [],
                    json: '',
                    url: 'https://orgbook.gov.bc.ca/api/v3/search/autocomplete',
                    resource: '',
                    custom: ''
                },
                limit: 100,
                logic: [],
                filter: 'latest=true&inactive=false&revoked=false',
                dataType: 'string',
                template: '{{ item.value }}',
                placeholder: 'Start typing to search BC Registered Businesses database',
                searchField: 'q',
                selectValues: 'results',
                valueProperty: 'value',
                selectFields: '',
                searchThreshold: 3,
                minSearch: 3,
                hidden: false,
                prefix: '',
                suffix: '',
                unique: false,
                widget: '',
                dbIndex: false,
                overlay: {
                    top: '',
                    left: '',
                    page: '',
                    style: '',
                    width: '',
                    height: ''
                },
                tooltip: '',
                disabled: false,
                lazyLoad: true,
                multiple: false,
                redrawOn: '',
                tabindex: '',
                validate: {
                    json: '',
                    custom: '',
                    select: false,
                    unique: false,
                    multiple: false,
                    required: false,
                    customMessage: '',
                    customPrivate: false,
                    strictDateValidation: false
                },
                autofocus: false,
                encrypted: false,
                hideLabel: false,
                indexeddb: {
                    filter: {}
                },
                modalEdit: false,
                protected: false,
                refreshOn: '',
                tableView: false,
                attributes: {},
                errorLabel: '',
                persistent: true,
                properties: {},
                validateOn: '',
                clearOnHide: true,
                conditional: {
                    eq: '',
                    json: '',
                    show: null,
                    when: null
                },
                customClass: '',
                description: '',
                fuseOptions: {
                    include: 'score',
                    threshold: 0.3
                },
                authenticate: false,
                defaultValue: '',
                disableLimit: false,
                customOptions: {
                    duplicateItemsAllowed: false
                },
                labelPosition: 'top',
                readOnlyValue: true,
                searchEnabled: true,
                showCharCount: false,
                showWordCount: false,
                uniqueOptions: false,
                calculateValue: '',
                clearOnRefresh: false,
                calculateServer: false,
                selectThreshold: 0.3,
                customConditional: '',
                allowMultipleMasks: false,
                customDefaultValue: '',
                allowCalculateOverride: false
            }], extend, false));
    };
    Object.defineProperty(Component, "builderInfo", {
        get: function () {
            return {
                title: 'Business Name Search',
                group: 'advanced',
                icon: 'database',
                weight: 70,
                documentation: Constants.DEFAULT_HELP_LINK,
                schema: Component.schema()
            };
        },
        enumerable: false,
        configurable: true
    });
    Component.editForm = editForm;
    return Component;
}(SelectComponent));
export default Component;
