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
var SelectComponent = Components.components.select;
import editForm from './OrgBook.form';
var ID = 'orgbook';
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
        return SelectComponent.schema.apply(SelectComponent, __spreadArrays([{
                type: ID,
                label: 'Registered Business Name',
                key: ID,
                idPath: 'id',
                dataSrc: 'url',
                data: {
                    values: [],
                    json: '',
                    url: 'https://orgbook.gov.bc.ca/api/v2/search/autocomplete',
                    resource: '',
                    custom: ''
                },
                limit: 100,
                logic: [],
                filter: 'latest=true&inactive=false&revoked=false',
                dataType: 'string',
                template: '{{ item.names[0].text }}',
                placeholder: 'Start typing to search BC Registered Businesses database',
                searchField: 'q',
                selectValues: 'results',
                valueProperty: 'names[0].text',
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
            }], extend));
    };
    Object.defineProperty(OrgBook, "builderInfo", {
        get: function () {
            return {
                title: 'Registered Business Search',
                group: 'advanced',
                icon: 'database',
                weight: 70,
                documentation: 'http://help.form.io/userguide/#select',
                schema: OrgBook.schema()
            };
        },
        enumerable: false,
        configurable: true
    });
    OrgBook.editForm = editForm;
    return OrgBook;
}(SelectComponent));
export default OrgBook;
