
/* tslint:disable */
/*globals grecaptcha*/
import {Components} from 'formiojs';
import { Constants } from '../Common/Constants';
import editForm from './Component.form';
import _get from 'lodash/get';
import _debounce from 'lodash/debounce';
import NativePromise from 'native-promise-only';

export const AddressComponentMode = {
  Autocomplete: 'autocomplete',
  Manual: 'manual',
};

const ParentComponent = (Components as any).components.recaptcha;

const ID = 'recap';
const DISPLAY = 'ReCaptcha';


export default class Component extends (ParentComponent as any) {
    static schema(...extend) {

        return ParentComponent.schema({
            label: DISPLAY,
            type: 'recaptcha',
            key: 'recaptcha',
            settings: {
              recaptcha: {
                secretKey: '6LewD-AmAAAAADvB-79cDPoOt4qHJ9fdmgO3Nst5',
                siteKey: '6LfPXuAmAAAAAHALt1ISGGfFAQE6b0P3ZqHorGOv'
              }
            }
        }, ...extend);
    }

    static get builderInfo() {
        return {
            title: ID,
            group: 'advanced',
            icon: 'address-book',
            weight: 100,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema(),

        };
    }

    public static editForm = editForm;

    createInput() {
        if (this.builderMode) {
          // We need to see it in builder mode.
          this.append(this.text(this.name));
        }
        else {
          const siteKey = '6LfPXuAmAAAAAHALt1ISGGfFAQE6b0P3ZqHorGOv';
          //_get(this.root.form, 'settings.recaptcha.siteKey');
          console.log('-------->>> ', siteKey);
          if (siteKey) {
            const recaptchaApiScriptUrl = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
            this.recaptchaApiReady = Formio.requireLibrary('googleRecaptcha', 'grecaptcha', recaptchaApiScriptUrl, true);
          }
          else {
            console.warn('There is no Site Key specified in settings in form JSONssss');
          }
        }
      }

      createLabel() {
        return;
      }

      verify(actionName) {

        //const siteKey = _get(this.root.form, 'settings.recaptcha.siteKey');
        const siteKey = '6LfPXuAmAAAAAHALt1ISGGfFAQE6b0P3ZqHorGOv';
        console.log('-------->>> ', siteKey);
        if (!siteKey) {
          console.warn('There is no Site Key specified in settings in form JSONssss');
          return;
        }
        if (!this.recaptchaApiReady) {
          const recaptchaApiScriptUrl = `https://www.google.com/recaptcha/api.js?render=${_get(this.root.form, 'settings.recaptcha.siteKey')}`;
          this.recaptchaApiReady = Formio.requireLibrary('googleRecaptcha', 'grecaptcha', recaptchaApiScriptUrl, true);
        }
        if (this.recaptchaApiReady) {
          this.recaptchaVerifiedPromise = new NativePromise((resolve, reject) => {
            this.recaptchaApiReady
              .then(() => {
                if (!this.isLoading) {
                  this.isLoading= true;
                  grecaptcha.ready(_debounce(() => {
                    grecaptcha
                      .execute(siteKey, {
                        action: actionName
                      })
                      .then((token) => {
                        return this.sendVerificationRequest(token).then(({ verificationResult, token }) => {
                          this.recaptchaResult = {
                            ...verificationResult,
                            token,
                          };
                          this.updateValue(this.recaptchaResult);
                          return resolve(verificationResult);
                        });
                      })
                      //.catch(() => {
                      //  this.isLoading = false;
                      //});
                  }, 1000));
                }
              })
              .catch(() => {
                return reject();
              });
          }).then(() => {
            this.isLoading = false;
          });
        }
      }

      beforeSubmit() {
        if (this.recaptchaVerifiedPromise) {
          return this.recaptchaVerifiedPromise
            .then(() => super.beforeSubmit());
        }
        return super.beforeSubmit();
      }

      sendVerificationRequest(token) {
        return Formio.makeStaticRequest(`${Formio.projectUrl}/recaptcha?recaptchaToken=${token}`)
          .then((verificationResult) => ({ verificationResult, token }));
      }

      checkComponentValidity(data, dirty, row, options = {}) {
        data = data || this.rootValue;
        row = row || this.data;
        const async = options['async'] || false;

        // Verification could be async only
        if (!async) {
          return super.checkComponentValidity(data, dirty, row, options);
        }

        const componentData = row[this.component.key];
        if (!componentData || !componentData.token) {
          this.setCustomValidity('ReCAPTCHA: Token is not specified in submission');
          return NativePromise.resolve(false);
        }

        if (!componentData.success) {
          this.setCustomValidity('ReCAPTCHA: Token validation error');
          return NativePromise.resolve(false);
        }

        return this.hook('validateReCaptcha', componentData.token, () => NativePromise.resolve(true))
          .then((success) => success)
          .catch((err) => {
            this.setCustomValidity(err.message || err);
            return false;
          });
      }

      normalizeValue(newValue) {
        // If a recaptcha result has already been established, then do not allow it to be reset.
        return this.recaptchaResult ? this.recaptchaResult : newValue;
      }

}
export {};
