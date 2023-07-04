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
/*globals grecaptcha*/
import { Components } from 'formiojs';
import { Constants } from '../Common/Constants';
import editForm from './Component.form';
import _get from 'lodash/get';
import _debounce from 'lodash/debounce';
import NativePromise from 'native-promise-only';
export var AddressComponentMode = {
    Autocomplete: 'autocomplete',
    Manual: 'manual',
};
var ParentComponent = Components.components.recaptcha;
var ID = 'recap';
var DISPLAY = 'ReCaptcha';
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
        return ParentComponent.schema.apply(ParentComponent, __spreadArray([{
                label: DISPLAY,
                type: 'recaptcha',
                key: 'recaptcha',
                settings: {
                    recaptcha: {
                        secretKey: '6LewD-AmAAAAADvB-79cDPoOt4qHJ9fdmgO3Nst5',
                        siteKey: '6LfPXuAmAAAAAHALt1ISGGfFAQE6b0P3ZqHorGOv'
                    }
                }
            }], extend, false));
    };
    Object.defineProperty(Component, "builderInfo", {
        get: function () {
            return {
                title: ID,
                group: 'advanced',
                icon: 'address-book',
                weight: 100,
                documentation: Constants.DEFAULT_HELP_LINK,
                schema: Component.schema(),
            };
        },
        enumerable: false,
        configurable: true
    });
    Component.prototype.createInput = function () {
        if (this.builderMode) {
            // We need to see it in builder mode.
            this.append(this.text(this.name));
        }
        else {
            var siteKey = '6LfPXuAmAAAAAHALt1ISGGfFAQE6b0P3ZqHorGOv';
            //_get(this.root.form, 'settings.recaptcha.siteKey');
            console.log('-------->>> ', siteKey);
            if (siteKey) {
                var recaptchaApiScriptUrl = "https://www.google.com/recaptcha/api.js?render=".concat(siteKey);
                this.recaptchaApiReady = Formio.requireLibrary('googleRecaptcha', 'grecaptcha', recaptchaApiScriptUrl, true);
            }
            else {
                console.warn('There is no Site Key specified in settings in form JSONssss');
            }
        }
    };
    Component.prototype.createLabel = function () {
        return;
    };
    Component.prototype.verify = function (actionName) {
        var _this = this;
        //const siteKey = _get(this.root.form, 'settings.recaptcha.siteKey');
        var siteKey = '6LfPXuAmAAAAAHALt1ISGGfFAQE6b0P3ZqHorGOv';
        console.log('-------->>> ', siteKey);
        if (!siteKey) {
            console.warn('There is no Site Key specified in settings in form JSONssss');
            return;
        }
        if (!this.recaptchaApiReady) {
            var recaptchaApiScriptUrl = "https://www.google.com/recaptcha/api.js?render=".concat(_get(this.root.form, 'settings.recaptcha.siteKey'));
            this.recaptchaApiReady = Formio.requireLibrary('googleRecaptcha', 'grecaptcha', recaptchaApiScriptUrl, true);
        }
        if (this.recaptchaApiReady) {
            this.recaptchaVerifiedPromise = new NativePromise(function (resolve, reject) {
                _this.recaptchaApiReady
                    .then(function () {
                    if (!_this.isLoading) {
                        _this.isLoading = true;
                        grecaptcha.ready(_debounce(function () {
                            grecaptcha
                                .execute(siteKey, {
                                action: actionName
                            })
                                .then(function (token) {
                                return _this.sendVerificationRequest(token).then(function (_a) {
                                    var verificationResult = _a.verificationResult, token = _a.token;
                                    _this.recaptchaResult = __assign(__assign({}, verificationResult), { token: token });
                                    _this.updateValue(_this.recaptchaResult);
                                    return resolve(verificationResult);
                                });
                            });
                            //.catch(() => {
                            //  this.isLoading = false;
                            //});
                        }, 1000));
                    }
                })
                    .catch(function () {
                    return reject();
                });
            }).then(function () {
                _this.isLoading = false;
            });
        }
    };
    Component.prototype.beforeSubmit = function () {
        var _this = this;
        if (this.recaptchaVerifiedPromise) {
            return this.recaptchaVerifiedPromise
                .then(function () { return _super.prototype.beforeSubmit.call(_this); });
        }
        return _super.prototype.beforeSubmit.call(this);
    };
    Component.prototype.sendVerificationRequest = function (token) {
        return Formio.makeStaticRequest("".concat(Formio.projectUrl, "/recaptcha?recaptchaToken=").concat(token))
            .then(function (verificationResult) { return ({ verificationResult: verificationResult, token: token }); });
    };
    Component.prototype.checkComponentValidity = function (data, dirty, row, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        data = data || this.rootValue;
        row = row || this.data;
        var async = options['async'] || false;
        // Verification could be async only
        if (!async) {
            return _super.prototype.checkComponentValidity.call(this, data, dirty, row, options);
        }
        var componentData = row[this.component.key];
        if (!componentData || !componentData.token) {
            this.setCustomValidity('ReCAPTCHA: Token is not specified in submission');
            return NativePromise.resolve(false);
        }
        if (!componentData.success) {
            this.setCustomValidity('ReCAPTCHA: Token validation error');
            return NativePromise.resolve(false);
        }
        return this.hook('validateReCaptcha', componentData.token, function () { return NativePromise.resolve(true); })
            .then(function (success) { return success; })
            .catch(function (err) {
            _this.setCustomValidity(err.message || err);
            return false;
        });
    };
    Component.prototype.normalizeValue = function (newValue) {
        // If a recaptcha result has already been established, then do not allow it to be reset.
        return this.recaptchaResult ? this.recaptchaResult : newValue;
    };
    Component.editForm = editForm;
    return Component;
}(ParentComponent));
export default Component;
