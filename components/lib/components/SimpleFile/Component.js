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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { Components, Utils } from 'formiojs';
var ParentComponent = Components.components.file;
import editForm from './Component.form';
import { Constants } from '../Common/Constants';
var uniqueName = Utils.uniqueName;
var ID = 'simplefile';
var DISPLAY = 'File Upload';
var Component = /** @class */ (function (_super) {
    __extends(Component, _super);
    function Component() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var _this = _super.apply(this, args) || this;
        try {
            if (_this.options && _this.options.componentOptions) {
                // componentOptions are passed in from the viewer, basically runtime configuration
                var opts = _this.options.componentOptions[ID];
                _this.component.options = __assign(__assign({}, _this.component.options), opts);
                // the config.uploads object will say what size our server can handle and what path to use.
                if (opts.config && opts.config.uploads) {
                    var remSlash = function (s) { return s.replace(/^\s*\/*\s*|\s*\/*\s*$/gm, ''); };
                    var cfg = opts.config;
                    var uploads = cfg.uploads;
                    _this.component.fileMinSize = uploads.fileMinSize;
                    _this.component.fileMaxSize = uploads.fileMaxSize;
                    // set the default url to be for uploads.
                    _this.component.url = "/".concat(remSlash(cfg.basePath), "/").concat(remSlash(cfg.apiPath), "/").concat(remSlash(uploads.path));
                    // no idea what to do with this yet...
                    _this._enabled = uploads.enabled;
                }
            }
        }
        catch (e) { }
        ;
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
                storage: 'chefs',
                url: '/files',
                fileKey: 'files',
                fileNameTemplate: '{{fileName}}',
                image: false,
                webcam: false,
                webcamSize: 320,
                privateDownload: false,
                imageSize: '200',
                filePattern: '*',
                fileMinSize: '0KB',
                fileMaxSize: '1GB',
                uploadOnly: false,
                customClass: 'formio-component-file'
            }], extend, false));
    };
    Object.defineProperty(Component, "builderInfo", {
        get: function () {
            return {
                title: DISPLAY,
                group: 'simple',
                icon: 'file',
                weight: 13,
                documentation: Constants.DEFAULT_HELP_LINK,
                schema: Component.schema()
            };
        },
        enumerable: false,
        configurable: true
    });
    Component.prototype.deleteFile = function (fileInfo) {
        var _a = this.component.options, options = _a === void 0 ? {} : _a;
        var Provider = Formio.Providers.getProvider('storage', this.component.storage);
        if (Provider) {
            var provider = new Provider(this);
            if (fileInfo && provider && typeof provider.deleteFile === 'function') {
                provider.deleteFile(fileInfo, options);
            }
        }
    };
    Component.prototype.upload = function (files) {
        var _this = this;
        // Only allow one upload if not multiple.
        if (!this.component.multiple) {
            files = Array.prototype.slice.call(files, 0, 1);
        }
        if (this.component.storage && files && files.length) {
            // files is not really an array and does not have a forEach method, so fake it.
            Array.prototype.forEach.call(files, function (file) {
                var fileName = uniqueName(file.name, _this.component.fileNameTemplate, _this.evalContext());
                var fileUpload = {
                    originalName: file.name,
                    name: fileName,
                    size: file.size,
                    status: 'info',
                    message: _this.t('Starting upload'),
                };
                // Check file pattern
                if (_this.component.filePattern && !_this.validatePattern(file, _this.component.filePattern)) {
                    fileUpload.status = 'error';
                    fileUpload.message = _this.t('File is the wrong type; it must be {{ pattern }}', {
                        pattern: _this.component.filePattern,
                    });
                }
                // Check file minimum size
                if (_this.component.fileMinSize && !_this.validateMinSize(file, _this.component.fileMinSize)) {
                    fileUpload.status = 'error';
                    fileUpload.message = _this.t('File is too small; it must be at least {{ size }}', {
                        size: _this.component.fileMinSize,
                    });
                }
                // Check file maximum size
                if (_this.component.fileMaxSize && !_this.validateMaxSize(file, _this.component.fileMaxSize)) {
                    fileUpload.status = 'error';
                    fileUpload.message = _this.t('File is too big; it must be at most {{ size }}', {
                        size: _this.component.fileMaxSize,
                    });
                }
                // Get a unique name for this file to keep file collisions from occurring.
                var dir = _this.interpolate(_this.component.dir || '');
                var fileService = _this.fileService;
                if (!fileService) {
                    fileUpload.status = 'error';
                    fileUpload.message = _this.t('File Service not provided.');
                }
                _this.statuses.push(fileUpload);
                _this.redraw();
                if (fileUpload.status !== 'error') {
                    if (_this.component.privateDownload) {
                        file.private = true;
                    }
                    var _a = _this.component, storage = _a.storage, _b = _a.options, options = _b === void 0 ? {} : _b;
                    var url = _this.interpolate(_this.component.url);
                    var groupKey_1 = null;
                    var groupPermissions_1 = null;
                    //Iterate through form components to find group resource if one exists
                    _this.root.everyComponent(function (element) {
                        var _a, _b;
                        if (((_a = element.component) === null || _a === void 0 ? void 0 : _a.submissionAccess) || ((_b = element.component) === null || _b === void 0 ? void 0 : _b.defaultPermission)) {
                            groupPermissions_1 = !element.component.submissionAccess ? [
                                {
                                    type: element.component.defaultPermission,
                                    roles: [],
                                },
                            ] : element.component.submissionAccess;
                            groupPermissions_1.forEach(function (permission) {
                                groupKey_1 = ['admin', 'write', 'create'].includes(permission.type) ? element.component.key : null;
                            });
                        }
                    });
                    var fileKey = _this.component.fileKey || 'file';
                    var groupResourceId = groupKey_1 ? _this.currentForm.submission.data[groupKey_1]._id : null;
                    fileService.uploadFile(storage, file, fileName, dir, function (evt) {
                        fileUpload.status = 'progress';
                        // @ts-ignore
                        fileUpload.progress = parseInt(100.0 * evt.loaded / evt.total);
                        delete fileUpload.message;
                        _this.redraw();
                    }, url, options, fileKey, groupPermissions_1, groupResourceId)
                        .then(function (fileInfo) {
                        var index = _this.statuses.indexOf(fileUpload);
                        if (index !== -1) {
                            _this.statuses.splice(index, 1);
                        }
                        fileInfo.originalName = file.name;
                        if (!_this.hasValue()) {
                            _this.dataValue = [];
                        }
                        _this.dataValue.push(fileInfo);
                        _this.redraw();
                        _this.triggerChange();
                    })
                        .catch(function (response) {
                        fileUpload.status = 'error';
                        // grab the detail out our api-problem response.
                        fileUpload.message = response.detail;
                        // @ts-ignore
                        delete fileUpload.progress;
                        _this.redraw();
                    });
                }
            });
        }
    };
    Component.prototype.getFile = function (fileInfo) {
        var _a = this.component.options, options = _a === void 0 ? {} : _a;
        var fileService = this.fileService;
        if (!fileService) {
            return alert('File Service not provided');
        }
        fileService.downloadFile(fileInfo, options)
            .catch(function (response) {
            // Is alert the best way to do this?
            // User is expecting an immediate notification due to attempting to download a file.
            alert(response);
        });
    };
    Component.editForm = editForm;
    return Component;
}(ParentComponent));
export default Component;
