<script>
import _ from 'lodash';
import { mapActions, mapState } from 'pinia';
import { Form } from '@formio/vue';

import BaseDialog from '~/components/base/BaseDialog.vue';
import FormViewerActions from '~/components/designer/FormViewerActions.vue';
import FormViewerMultiUpload from '~/components/designer/FormViewerMultiUpload.vue';
import { i18n } from '~/internationalization';
import templateExtensions from '~/plugins/templateExtensions';
import { formService, rbacService } from '~/services';
import { useAppStore } from '~/store/app';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

import { isFormPublic } from '~/utils/permissionUtils';
import { attachAttributesToLinks } from '~/utils/transformUtils';
import { FormPermissions, NotificationTypes } from '~/utils/constants';

export default {
  components: {
    BaseDialog,
    formio: Form,
    FormViewerActions,
    FormViewerMultiUpload,
  },
  props: {
    displayTitle: {
      type: Boolean,
      default: false,
    },
    draftId: {
      type: String,
      default: null,
    },
    formId: {
      type: String,
      default: null,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
    preview: Boolean,
    staffEditMode: {
      type: Boolean,
      default: false,
    },
    saved: {
      type: Boolean,
      default: false,
    },
    submissionId: {
      type: String,
      default: null,
    },
    versionId: {
      type: String,
      default: null,
    },
    isDuplicate: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['submission-updated'],
  data() {
    return {
      allowSubmitterToUploadFile: false,
      block: false,
      bulkFile: false,
      confirmSubmit: false,
      currentForm: {},
      doYouWantToSaveTheDraft: false,
      forceNewTabLinks: true,
      form: {},
      formDataEntered: false,
      formElement: undefined,
      formFields: [],
      formSchema: {},
      isFormScheduleExpired: false,
      isLateSubmissionAllowed: false,
      isLoading: false,
      json_csv: {
        data: [],
        file_name: String,
      },
      loadingSubmission: false,
      permissions: [],
      reRenderFormIo: 0,
      saveDraftDialog: false,
      saveDraftState: 0,
      saving: false,
      sbdMessage: {
        message: String,
        error: Boolean,
        upload_state: Number,
        response: [],
        file_name: String,
        typeError: Number,
      },
      showModal: false,
      showSubmitConfirmDialog: false,
      submission: { data: { lateEntry: false } },
      submissionRecord: {},
      version: 0,
      versionIdToSubmitTo: this.versionId,
    };
  },
  computed: {
    ...mapState(useAppStore, ['config']),
    ...mapState(useAuthStore, [
      'authenticated',
      'token',
      'tokenParsed',
      'user',
    ]),
    ...mapState(useFormStore, ['lang', 'isRTL']),

    formScheduleExpireMessage() {
      return i18n.t('trans.formViewer.formScheduleExpireMessage');
    },
    NOTIFICATIONS_TYPES() {
      return NotificationTypes;
    },
    viewerOptions() {
      // Force recomputation of viewerOptions after rerendered formio to prevent duplicate submission update calls
      this.reRenderFormIo;

      return {
        sanitizeConfig: {
          addTags: ['iframe'],
          ALLOWED_TAGS: ['iframe'],
        },
        templates: templateExtensions,
        readOnly: this.readOnly,
        hooks: {
          beforeSubmit: this.onBeforeSubmit,
        },
        // pass in options for custom components to use
        componentOptions: {
          simplefile: {
            config: this.config,
            chefsToken: this.getCurrentAuthHeader,
          },
        },
        evalContext: {
          token: this.tokenParsed,
          user: this.user,
        },
      };
    },
    canSaveDraft() {
      return (
        !this.readOnly &&
        this.permissions.includes(FormPermissions.SUBMISSION_UPDATE)
      );
    },
  },
  watch: {
    lang() {
      this.reRenderFormIo += 1;
    },
  },
  async mounted() {
    if (this.submissionId && this.isDuplicate) {
      // Run when make new submission from existing one called. Get the
      // published version of form, and then get the submission data.
      await this.getFormSchema();
      await this.getFormData();
    } else if (this.submissionId && !this.isDuplicate) {
      await this.getFormData();
    } else {
      this.showModal = true;
      await this.getFormSchema();
    }

    window.addEventListener('beforeunload', this.beforeWindowUnload);

    this.reRenderFormIo += 1;
  },
  beforeUnmount() {
    window.removeEventListener('beforeunload', this.beforeWindowUnload);
  },
  beforeUpdate() {
    if (this.forceNewTabLinks) {
      attachAttributesToLinks(this.formSchema.components);
    }
  },
  methods: {
    ...mapActions(useNotificationStore, ['addNotification']),
    isFormPublic: isFormPublic,
    getCurrentAuthHeader() {
      return `Bearer ${this.token}`;
    },
    async getFormData() {
      function iterate(obj, stack, fields, propNeeded) {
        //Get property path from nested object
        for (let property in obj) {
          const innerObject = obj[property];

          if (propNeeded === property) {
            fields = fields + stack + '.' + property;
            return fields.replace(/^\./, '');
          } else if (Array.isArray(innerObject)) {
            // When the form contains a Data Grid there will be an array that
            // needs to be checked, and an array of properties to be unset.
            const fieldsArray = [];
            for (let i = 0; i < innerObject.length; i++) {
              const next = iterate(
                innerObject[i],
                stack + '.' + property + '[' + i + ']',
                fields,
                propNeeded
              );

              if (next) {
                fieldsArray.push(next);
              }
            }

            if (fieldsArray.length > 0) {
              return fieldsArray;
            }
          } else if (typeof innerObject === 'object') {
            return iterate(
              innerObject,
              stack + '.' + property,
              fields,
              propNeeded
            );
          }
        }
      }

      function deleteFieldData(fieldcomponent, submission) {
        if (Object.prototype.hasOwnProperty.call(fieldcomponent, 'columns')) {
          // It's a layout component that has columns.
          fieldcomponent.columns.map((subComponent) => {
            deleteFieldData(subComponent, submission);
          });
        } else if (
          Object.prototype.hasOwnProperty.call(fieldcomponent, 'components')
        ) {
          // It's a layout component that has subcomponents, such as a panel.
          fieldcomponent.components.map((subComponent) => {
            deleteFieldData(subComponent, submission);
          });
        } else if (fieldcomponent?.validate?.isUseForCopy === false) {
          const fieldPath = iterate(submission, '', '', fieldcomponent.key);
          if (Array.isArray(fieldPath)) {
            for (let path of fieldPath) {
              _.unset(submission, path);
            }
          } else if (fieldPath) {
            _.unset(submission, fieldPath);
          }
        }
      }

      try {
        this.loadingSubmission = true;
        const response = await formService.getSubmission(this.submissionId);
        this.submissionRecord = Object.assign({}, response.data.submission);
        this.submission = this.submissionRecord.submission;
        this.showModal =
          this.submission.data.submit ||
          this.submission.data.state == 'submitted' ||
          !this.submissionRecord.draft ||
          this.readOnly
            ? false
            : true;
        this.form = response.data.form;
        this.versionIdToSubmitTo = response.data?.version?.id;
        if (!this.isDuplicate) {
          //As we know this is a Submission from existing one so we will wait for the latest version to be set on the getFormSchema
          this.formSchema = response.data.version.schema;
          this.version = response.data.version.version;
        } else {
          if (
            response.data?.version?.schema?.components &&
            response.data?.version?.schema?.components.length
          ) {
            response.data.version.schema.components.map((component) => {
              deleteFieldData(component, this.submission); //Delete all the fields data that are not enabled for duplication
            });
          }
        }
        // Get permissions
        if (!this.staffEditMode && !isFormPublic(this.form)) {
          const permRes = await rbacService.getUserSubmissions({
            formSubmissionId: this.submissionId,
          });
          this.permissions = permRes.data[0] ? permRes.data[0].permissions : [];
        }
      } catch (error) {
        this.addNotification({
          text: i18n.t('trans.formViewer.getUsersSubmissionsErrMsg'),
          consoleError: i18n.t(
            'trans.formViewer.getUsersSubmissionsConsoleErrMsg',
            { submissionId: this.submissionId, error: error }
          ),
        });
      } finally {
        this.loadingSubmission = false;
      }
    },
    // Get the form definition/schema
    async getFormSchema() {
      try {
        let response = undefined;
        if (this.versionId) {
          this.versionIdToSubmitTo = this.versionId;
          // If getting for a specific older version of the form
          response = await formService.readVersion(this.formId, this.versionId);
          if (!response.data || !response.data.schema) {
            throw new Error(
              i18n.t('trans.formViewer.readVersionErrMsg', {
                versionId: this.versionId,
              })
            );
          }
          this.form = response.data;
          this.version = response.data.version;
          this.formSchema = response.data.schema;
        } else if (this.draftId) {
          // If getting for a specific draft version of the form for preview
          response = await formService.readDraft(this.formId, this.draftId);
          if (!response.data || !response.data.schema) {
            throw new Error(
              i18n.t('trans.formViewer.readDraftErrMsg', {
                draftId: this.draftId,
              })
            );
          }
          this.form = response.data;
          this.formSchema = response.data.schema;
        } else {
          // If getting the HEAD form version (IE making a new submission)
          response = await formService.readPublished(this.formId);
          if (
            !response.data ||
            !response.data.versions ||
            !response.data.versions[0]
          ) {
            this.$router.push({
              name: 'Alert',
              query: {
                text: i18n.t('trans.formViewer.alertRouteMsg'),
                type: 'info',
              },
            });
            return;
          }
          this.form = response.data;
          this.version = response.data.versions[0].version;
          this.versionIdToSubmitTo = response.data.versions[0].id;
          this.formSchema = response.data.versions[0].schema;

          if (response.data.schedule && response.data.schedule.expire) {
            let formScheduleStatus = response.data.schedule;
            this.isFormScheduleExpired = formScheduleStatus.expire;
            this.isLateSubmissionAllowed =
              formScheduleStatus.allowLateSubmissions;
            this.formScheduleExpireMessage = formScheduleStatus.message;
          }
        }
      } catch (error) {
        if (this.authenticated) {
          this.isFormScheduleExpired = true;
          this.isLateSubmissionAllowed = false;
          this.formScheduleExpireMessage = error.message;
          this.addNotification({
            text: i18n.t('trans.formViewer.fecthingFormErrMsg'),
            consoleError: i18n.t('trans.formViewer.fecthingFormConsoleErrMsg', {
              versionId: this.versionId,
              error: error,
            }),
          });
        }
      }
    },
    toggleBlock(e) {
      this.block = e;
    },
    formChange(e) {
      // if draft check validation on render
      if (this.submissionRecord.draft) {
        this.$refs.chefForm.formio.checkValidity(null, true, null, false);
      }
      if (e.changed != undefined && !e.changed.flags.fromSubmission) {
        this.formDataEntered = true;
      }

      // Seems to be the only place the form changes on load
      this.jsonManager();
    },
    jsonManager() {
      this.json_csv.file_name = 'template_' + this.form.name + '_' + Date.now();
      if (this.$refs.chefForm?.formio) {
        this.formElement = this.$refs.chefForm.formio;
        this.json_csv.data = [
          JSON.parse(JSON.stringify(this.formElement._data)),
          JSON.parse(JSON.stringify(this.formElement._data)),
        ];
      }
    },
    resetMessage() {
      this.sbdMessage.message = undefined;
      this.sbdMessage.error = false;
      this.sbdMessage.upload_state = 0;
      this.sbdMessage.response = [];
      this.sbdMessage.file_name = undefined;
      this.sbdMessage.typeError = -1;
      this.block = false;
    },
    async saveBulkData(submissions) {
      const payload = {
        draft: true,
        submission: Object.freeze({ data: submissions }),
      };
      this.block = true;
      this.sendMultiSubmissionData(payload);
    },
    async sendMultiSubmissionData(body) {
      try {
        this.saving = true;
        let response = await formService.createMultiSubmission(
          this.formId,
          this.versionIdToSubmitTo,
          body
        );
        if ([200, 201].includes(response.status)) {
          // all is good, flag no errors and carry on...
          // store our submission result...
          this.sbdMessage.message = i18n.t(
            'trans.formViewer.multiDraftUploadSuccess'
          );
          this.sbdMessage.error = false;
          this.sbdMessage.upload_state = 10;
          this.sbdMessage.response = [];
          this.block = false;
          this.saving = false;
          this.addNotification({
            text: this.sbdMessage.message,
            ...NotificationTypes.SUCCESS,
          });
        } else {
          this.sbdMessage.message = i18n.t(
            'trans.formViewer.failedResSubmissn',
            {
              status: response.status,
            }
          );
          this.sbdMessage.error = true;
          this.sbdMessage.upload_state = 10;
          this.block = false;
          this.sbdMessage.response = [
            { error_message: i18n.t('trans.formViewer.errSubmittingForm') },
          ];
          this.sbdMessage.file_name =
            'error_report_' + this.form.name + '_' + Date.now();
          this.saving = false;
          i18n.t('trans.formViewer.errSubmittingForm');
          throw new Error(
            i18n.t('trans.formViewer.failedResSubmissn', {
              status: response.status,
            })
          );
        }
      } catch (error) {
        this.saving = false;
        this.block = false;
        this.setFinalError(error);
        this.addNotification({
          text: this.sbdMessage.message,
          consoleError: i18n.t('trans.formViewer.errorSavingFile', {
            fileName: this.json_csv.file_name,
            error: error,
          }),
        });
      }
    },
    async setFinalError(error) {
      try {
        if (error.response.data != undefined) {
          this.sbdMessage.message =
            error.response.data.title == undefined
              ? i18n.t('trans.formViewer.errSubmittingForm')
              : error.response.data.title;
          this.sbdMessage.error = true;
          this.sbdMessage.upload_state = 10;
          this.sbdMessage.response =
            error.response.data.reports == undefined
              ? [
                  {
                    error_message: i18n.t('trans.formViewer.errSubmittingForm'),
                  },
                ]
              : await this.formatResponse(error.response.data.reports);
          this.sbdMessage.file_name =
            'error_report_' + this.form.name + '_' + Date.now();
        } else {
          this.sbdMessage.message = i18n.t(
            'trans.formViewer.errSubmittingForm'
          );
          this.sbdMessage.error = true;
          this.sbdMessage.upload_state = 10;
          this.sbdMessage.response = [
            { error_message: i18n.t('trans.formViewer.errSubmittingForm') },
          ];
          this.sbdMessage.file_name =
            'error_report_' + this.form.name + '_' + Date.now();
        }
      } catch (error_2) {
        this.sbdMessage.message = i18n.t('trans.formViewer.errSubmittingForm');
        this.sbdMessage.error = true;
        this.sbdMessage.upload_state = 10;
        this.sbdMessage.response = [
          { error_message: i18n.t('trans.formViewer.errSubmittingForm') },
        ];
        this.sbdMessage.file_name =
          'error_report_' + this.form.name + '_' + Date.now();
      }
    },
    buildValidationFromComponent(obj) {
      if (obj?.component?.validate) {
        let validatorIdentity = '';
        Object.keys(obj.component.validate).forEach((validity) => {
          switch (validity) {
            case 'maxSelectedCount':
              if (obj.component.validate.maxSelectedCount) {
                validatorIdentity +=
                  '|maxSelectedCount:' + obj.component.validate[validity];
              }
              break;

            case 'minSelectedCount':
              if (obj.component.validate.minSelectedCount) {
                validatorIdentity +=
                  '|minSelectedCount:' + obj.component.validate[validity];
              }
              break;

            case 'multiple':
              if (obj.component.validate.multiple) {
                validatorIdentity +=
                  '|multiple:' + obj.component.validate[validity];
              }
              break;

            case 'onlyAvailableItems':
              if (obj.component.validate.onlyAvailableItems) {
                validatorIdentity +=
                  '|onlyAvailableItems:' + obj.component.validate[validity];
              }
              break;

            case 'required':
              if (obj.component.validate.required) {
                validatorIdentity +=
                  '|required:' + obj.component.validate[validity];
              }
              break;

            case 'strictDateValidation':
              if (obj.component.validate.strictDateValidation) {
                validatorIdentity +=
                  '|strictDateValidation:' + obj.component.validate[validity];
              }
              break;

            case 'unique':
              if (obj.component.validate.unique) {
                validatorIdentity +=
                  '|unique:' + obj.component.validate[validity];
              }
              break;

            case 'custom':
              if (obj.component.validate.custom.length) {
                validatorIdentity +=
                  '|custom:' +
                  obj.component.validate[validity].trim().replaceAll(',', '‚');
              }
              break;

            case 'customMessage':
              if (obj.component.validate.customMessage) {
                validatorIdentity +=
                  '|customMessage:' +
                  obj.component.validate[validity].trim().replaceAll(',', '‚');
              }
              break;

            case 'customPrivate':
              if (obj.component.validate.customPrivate) {
                validatorIdentity +=
                  '|customPrivate:' + obj.component.validate[validity].trim();
              }
              break;

            case 'json':
              if (obj.component.validate.json) {
                validatorIdentity +=
                  '|json:' + obj.component.validate[validity];
              }
              break;

            case 'pattern':
              if (obj.component.validate.pattern) {
                validatorIdentity +=
                  '|pattern:' + obj.component.validate[validity];
              }
              break;

            case 'maxWords':
              if (obj.component.validate.maxWords) {
                validatorIdentity +=
                  '|maxWords:' + obj.component.validate[validity];
              }
              break;

            case 'minWords':
              if (obj.component.validate.minWords) {
                validatorIdentity +=
                  '|minWords:' + obj.component.validate[validity];
              }
              break;

            case 'maxLength':
              if (obj.component.validate.maxLength) {
                validatorIdentity +=
                  '|maxLength:' + obj.component.validate[validity];
              }
              break;

            case 'minLength':
              if (obj.component.validate.minLength) {
                validatorIdentity +=
                  '|minLength:' + obj.component.validate[validity];
              }
              break;

            default:
              validatorIdentity +=
                '|' + validity + ':' + obj.component.validate[validity];
              break;
          }
        });
        return validatorIdentity.replace(/^\|/, '');
      } else if (obj?.messages[0]?.context?.validator) {
        return obj.messages[0].context.validator;
      } else {
        return 'Unknown';
      }
    },

    async frontendFormatResponse(response) {
      let newResponse = [];

      for (const item of response) {
        if (item != null && item != undefined) {
          for (const obj of item.errors) {
            let error = {};

            if (obj.component != undefined) {
              error = {
                submission: item.submission,
                key: obj.component.key,
                label: obj.component.label,
                validator: this.buildValidationFromComponent(obj),
                error_message: obj.message,
              };
            } else {
              error = {
                submission: item.submission,
                key: null,
                label: null,
                validator: null,
                error_message: obj.message,
              };
            }

            newResponse.push(error);
          }
        }
      }

      return newResponse;
    },

    async formatResponse(response) {
      let newResponse = [];
      await response.forEach((item, index) => {
        if (item != null && item != undefined) {
          item.details.forEach((obj) => {
            let error = {};
            if (obj.context != undefined) {
              error = Object({
                ' submission': index,
                ' key': obj.context.key,
                ' label': obj.context.label,
                ' validator': obj.context.validator,
                error_message: obj.message,
              });
            } else {
              error = Object({
                ' submission': index,
                ' key': null,
                ' label': null,
                ' validator': null,
                error_message: obj.message,
              });
            }
            newResponse.push(error);
          });
        }
      });
      return newResponse;
    },
    async setError(error) {
      this.sbdMessage = error;

      try {
        if (error.response.data != undefined) {
          this.sbdMessage.message =
            error.response.data.title == undefined
              ? 'An error occurred submitting this form'
              : error.response.data.title;
          this.sbdMessage.error = true;
          this.sbdMessage.upload_state = 10;
          this.sbdMessage.response =
            error.response.data.reports == undefined
              ? [{ error_message: 'An error occurred submitting this form' }]
              : await this.frontendFormatResponse(error.response.data.reports);
          this.sbdMessage.file_name =
            'error_report_' + this.form.name + '_' + Date.now();
        } else {
          this.sbdMessage.message = 'An error occurred submitting this form';
          this.sbdMessage.error = true;
          this.sbdMessage.upload_state = 10;
          this.sbdMessage.response = [
            { error_message: 'An error occurred submitting this form' },
          ];
          this.sbdMessage.file_name =
            'error_report_' + this.form.name + '_' + Date.now();
        }
      } catch (error_2) {
        this.sbdMessage.message = 'An error occurred submitting this form';
        this.sbdMessage.error = true;
        this.sbdMessage.upload_state = 10;
        this.sbdMessage.response = [
          { error_message: 'An error occurred submitting this form' },
        ];
        this.sbdMessage.file_name =
          'error_report_' + this.form.name + '_' + Date.now();
      }
    },
    async saveDraft() {
      try {
        this.saving = true;

        const response = await this.sendSubmission(true, this.submission);
        if (this.submissionId) {
          // Editing an existing draft
          // Update this route with saved flag
          if (!this.saved) {
            this.$router.replace({
              name: 'UserFormDraftEdit',
              query: { ...this.$route.query, sv: true },
            });
          }
          this.saving = false;
        } else {
          // Creating a new submission in draft state
          // Go to the user form draft page
          this.$router.push({
            name: 'UserFormDraftEdit',
            query: {
              s: response.data.id,
              sv: true,
            },
          });
        }
        this.showSubmitConfirmDialog = false;
        this.saveDraftDialog = false;
      } catch (error) {
        this.addNotification({
          text: i18n.t('trans.formViewer.savingDraftErrMsg'),
          consoleError: i18n.t('trans.formViewer.fecthingFormConsoleErrMsg', {
            submissionId: this.submissionId,
            error: error,
          }),
        });
      }
    },
    async sendSubmission(isDraft, sub) {
      sub.data.lateEntry =
        this.form?.schedule?.expire !== undefined &&
        this.form.schedule.expire === true
          ? this.form.schedule.allowLateSubmissions
          : false;
      const body = {
        draft: isDraft,
        submission: sub,
      };

      let response;
      //let's check if this is a submission from existing one, If isDuplicate then create new submission if now isDuplicate then update the submission
      if (this.submissionId && !this.isDuplicate) {
        // Updating an existing submission
        response = await formService.updateSubmission(this.submissionId, body);
      } else {
        // Adding a new submission
        response = await formService.createSubmission(
          this.formId,
          this.versionIdToSubmitTo,
          body
        );
      }
      return response;
    },
    onFormRender() {
      if (this.isLoading) this.isLoading = false;
    },
    // -----------------------------------------------------------------------------------------
    // FormIO Events
    // -----------------------------------------------------------------------------------------
    // https://help.form.io/developers/form-renderer#form-events
    // event order is:
    // onSubmitButton
    // onBeforeSubmit
    // if no errors: onSubmit -> onSubmitDone
    // else onSubmitError
    onSubmitButton(event) {
      if (this.preview) {
        alert(i18n.t('trans.formViewer.submissionsPreviewAlert'));
        return;
      }
      // this is our first event in the submission chain.
      // most important thing here is ensuring that the formio form does not have an action, or else it POSTs to that action.
      // console.info('onSubmitButton()') ; // eslint-disable-line no-console
      this.currentForm = event.instance.parent.root;
      this.currentForm.form.action = undefined;

      // if form has drafts enabled in form settings, show 'confirm submit?' dialog
      if (this.form.enableSubmitterDraft) {
        this.showSubmitConfirmDialog = true;
      }
    },
    // If the confirm modal pops up on drafts
    continueSubmit() {
      this.confirmSubmit = true;
      this.showSubmitConfirmDialog = false;
    },
    // formIO hook, prior to a submission occurring
    // We can cancel a formIO submission event here, or go on
    async onBeforeSubmit(submission, next) {
      // dont do anything if previewing the form
      if (this.preview) {
        // Force re-render form.io to reset submit button state
        this.reRenderFormIo += 1;
        return;
      }

      // if form has drafts enabled in form setttings,
      if (this.form.enableSubmitterDraft) {
        // while 'confirm submit?' dialog is open..
        while (this.showSubmitConfirmDialog) {
          // await a promise that never resolves to block this thread
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        if (this.confirmSubmit) {
          this.confirmSubmit = false; // clear for next attempt
          next();
        } else {
          // Force re-render form.io to reset submit button state
          this.reRenderFormIo += 1;
        }
      } else {
        next();
      }
    },
    // FormIO submit event
    // eslint-disable-next-line no-unused-vars
    async onSubmit(sub) {
      if (this.preview) {
        alert(i18n.t('trans.formViewer.submissionsPreviewAlert'));
        this.confirmSubmit = false;
        return;
      }

      const errors = await this.doSubmit(sub);

      // if we are here, the submission has been saved to our db
      // the passed in submission is the formio submission, not our db persisted submission record...
      // fire off the submitDone event.
      if (errors) {
        this.addNotification({
          text: errors,
          consoleError: i18n.t('trans.formViewer.submissionsSubmitErrMsg', {
            errors: errors,
          }),
        });
      } else {
        this.currentForm.events.emit('formio.submitDone');
      }
    },
    // Not a formIO event, our saving routine to POST the submission to our API
    async doSubmit(sub) {
      // since we are not using formio api
      // we should do the actual submit here, and return any error that occurrs to handle in the submit event
      let errMsg = undefined;
      try {
        const response = await this.sendSubmission(false, sub);

        if ([200, 201].includes(response.status)) {
          // all is good, flag no errors and carry on...
          // store our submission result...
          this.submissionRecord = Object.assign(
            {},
            this.submissionId && this.isDuplicate //Check if this submission is creating with the existing one
              ? response.data
              : this.submissionId && !this.isDuplicate
              ? response.data.submission
              : response.data
          );
        } else {
          throw new Error(
            i18n.t('trans.formViewer.sendSubmissionErrMsg', {
              status: response.status,
            })
          );
        }
      } catch (error) {
        console.error(error); // eslint-disable-line no-console
        errMsg = i18n.t('trans.formViewer.errMsg');
      } finally {
        this.confirmSubmit = false;
      }
      return errMsg;
    },
    async onSubmitDone() {
      // huzzah!
      // really nothing to do, the formio button has consumed the event and updated its display
      // is there anything here for us to do?
      // console.info('onSubmitDone()') ; // eslint-disable-line no-console
      if (this.staffEditMode) {
        // updating an existing submission on the staff side
        this.$emit('submission-updated');
      } else {
        // User created new submission
        this.$router.push({
          name: 'FormSuccess',
          query: {
            s: this.submissionRecord.id,
          },
        });
      }
    },
    // Custom Event triggered from buttons with Action type "Event"
    onCustomEvent(event) {
      alert(i18n.t('trans.formViewer.customEventAlert', { event: event.type }));
    },
    switchView() {
      if (!this.bulkFile) {
        this.showdoYouWantToSaveTheDraftModalForSwitch();
        return;
      }
      this.bulkFile = !this.bulkFile;
    },
    showdoYouWantToSaveTheDraftModalForSwitch() {
      this.saveDraftState = 1;
      if (this.formDataEntered && this.showModal) {
        this.doYouWantToSaveTheDraft = true;
      } else {
        this.leaveThisPage();
      }
    },
    showdoYouWantToSaveTheDraftModal() {
      if (!this.bulkFile) {
        this.saveDraftState = 0;
        if (
          (this.submissionId == undefined || this.formDataEntered) &&
          this.showModal
        )
          this.doYouWantToSaveTheDraft = true;
        else this.leaveThisPage();
      } else {
        this.leaveThisPage();
      }
    },
    leaveThisPage() {
      if (this.saveDraftState == 0 || this.bulkFile) {
        this.$router.push({
          name: 'UserSubmissions',
          query: { f: this.form.id },
        });
      } else {
        this.bulkFile = !this.bulkFile;
      }
    },
    yes() {
      this.saveDraftFromModal(true);
    },
    no() {
      this.saveDraftFromModal(false);
    },
    saveDraftFromModal(event) {
      this.doYouWantToSaveTheDraft = false;
      if (event) {
        this.saveDraftFromModalNow();
      } else {
        this.leaveThisPage();
      }
    },
    // Custom Event triggered from buttons with Action type "Event"
    async saveDraftFromModalNow() {
      try {
        this.saving = true;
        await this.sendSubmission(true, this.submission);
        this.saving = false;
        // Creating a new submission in draft state
        // Go to the user form draft page
        this.leaveThisPage();
        this.showSubmitConfirmDialog = false;
      } catch (error) {
        this.addNotification({
          text: i18n.t('trans.formViewer.submittingDraftErrMsg'),
          consoleError: i18n.t('trans.formViewer.submittingDraftConsErrMsg', {
            submissionId: this.submissionId,
            error: error,
          }),
        });
      }
    },
    closeBulkYesOrNo() {
      this.doYouWantToSaveTheDraft = false;
    },
    beforeWindowUnload(e) {
      if (!this.preview && !this.readOnly) {
        e.preventDefault();
        e.returnValue = '';
      }
    },
  },
};
</script>

<template>
  <v-skeleton-loader :loading="loadingSubmission" type="article, actions">
    <v-container fluid>
      <div v-if="isFormScheduleExpired">
        <v-alert
          :text="
            isLateSubmissionAllowed
              ? $t('trans.formViewer.lateFormSubmissions')
              : formScheduleExpireMessage
          "
          prominent
          type="error"
          :class="{ 'dir-rtl': isRTL }"
          :lang="lang"
        >
        </v-alert>

        <div v-if="isLateSubmissionAllowed">
          <v-col cols="3" md="2">
            <v-btn
              color="primary"
              :class="{ 'dir-rtl': isRTL }"
              @click="isFormScheduleExpired = false"
            >
              <span :lang="lang">{{
                $t('trans.formViewer.createLateSubmission')
              }}</span>
            </v-btn>
          </v-col>
        </div>
      </div>

      <div v-else>
        <div v-if="displayTitle">
          <div v-if="!isFormPublic(form)">
            <FormViewerActions
              :allow-submitter-to-upload-file="form.allowSubmitterToUploadFile"
              :block="block"
              :bulk-file="bulkFile"
              :copy-existing-submission="form.enableCopyExistingSubmission"
              :draft-enabled="form.enableSubmitterDraft"
              :form-id="form.id"
              :is-draft="submissionRecord.draft"
              :permissions="permissions"
              :read-only="readOnly"
              :submission="submission"
              :submission-id="submissionId"
              class="d-print-none"
              @showdoYouWantToSaveTheDraftModal="
                showdoYouWantToSaveTheDraftModal
              "
              @save-draft="saveDraft"
              @switchView="switchView"
            />
          </div>
          <h1 class="my-6 text-center">{{ form.name }}</h1>
        </div>
        <div class="form-wrapper">
          <v-alert
            v-if="saved || saving"
            :class="
              saving
                ? NOTIFICATIONS_TYPES.INFO.class
                : NOTIFICATIONS_TYPES.SUCCESS.class
            "
            :icon="
              saving
                ? NOTIFICATIONS_TYPES.INFO.icon
                : NOTIFICATIONS_TYPES.SUCCESS.icon
            "
          >
            <div v-if="saving" :class="{ 'mr-2': isRTL }">
              <v-progress-linear indeterminate :lang="lang" />
              {{ $t('trans.formViewer.saving') }}
            </div>
            <div v-else :class="{ 'mr-2': isRTL }" :lang="lang">
              {{ $t('trans.formViewer.draftSaved') }}
            </div>
          </v-alert>

          <slot name="alert" :form="form" :class="{ 'dir-rtl': isRTL }" />

          <BaseDialog
            v-model="showSubmitConfirmDialog"
            type="CONTINUE"
            :enable-custom-button="canSaveDraft"
            @close-dialog="showSubmitConfirmDialog = false"
            @continue-dialog="continueSubmit"
          >
            <template #title>
              <span :lang="lang">{{
                $t('trans.formViewer.pleaseConfirm')
              }}</span></template
            >
            <template #text
              ><span :lang="lang">{{
                $t('trans.formViewer.submitFormWarningMsg')
              }}</span></template
            >
            <template #button-text-continue>
              <span :lang="lang">{{ $t('trans.formViewer.submit') }}</span>
            </template>
          </BaseDialog>

          <v-alert
            v-if="isLoading && !bulkFile && submissionId == undefined"
            class="mt-2 mb-2"
            :value="isLoading"
            :class="NOTIFICATIONS_TYPES.INFO.class"
            :color="NOTIFICATIONS_TYPES.INFO.color"
            :icon="NOTIFICATIONS_TYPES.INFO.icon"
          >
            <div color="info" icon="$info">
              <v-progress-linear
                :indeterminate="true"
                color="blue-grey-lighten-4"
                height="5"
              ></v-progress-linear>
              <span :class="{ 'mr-2': isRTL }" :lang="lang">
                {{ $t('trans.formViewer.formLoading') }}
              </span>
            </div>
          </v-alert>
          <FormViewerMultiUpload
            v-if="!isLoading && form.allowSubmitterToUploadFile && bulkFile"
            :response="sbdMessage"
            :form="form"
            :form-element="formElement"
            :form-schema="formSchema"
            :json-csv="json_csv"
            :form-fields="formFields"
            @save-bulk-data="saveBulkData"
            @reset-message="resetMessage"
            @set-error="setError"
            @toggleBlock="toggleBlock"
          />

          <formio
            v-if="!bulkFile"
            :key="reRenderFormIo"
            ref="chefForm"
            :class="{ 'v-locale--is-ltr': isRTL }"
            :form="formSchema"
            :submission="submission"
            :options="viewerOptions"
            :language="lang"
            @submit="onSubmit"
            @submitDone="onSubmitDone"
            @submitButton="onSubmitButton"
            @customEvent="onCustomEvent"
            @change="formChange"
            @render="onFormRender"
          />
          <p
            v-if="version"
            :class="{ 'text-left': isRTL }"
            class="mt-3"
            :lang="lang"
          >
            {{ $t('trans.formViewer.version', { version: version }) }}
          </p>
        </div>
      </div>
      <BaseDialog
        v-model="doYouWantToSaveTheDraft"
        :class="{ 'dir-rtl': isRTL }"
        type="SAVEDDELETE"
        :enable-custom-button="false"
        @close-dialog="closeBulkYesOrNo"
        @delete-dialog="no"
        @continue-dialog="yes"
      >
        <template #title
          ><span :lang="lang">
            {{ $t('trans.formViewer.pleaseConfirm') }}</span
          ></template
        >
        <template #text
          ><span :lang="lang">
            {{ $t('trans.formViewer.wantToSaveDraft') }}</span
          ></template
        >
        <template #button-text-continue>
          <span :lang="lang"> {{ $t('trans.formViewer.yes') }}</span>
        </template>
        <template #button-text-delete>
          <span :lang="lang"> {{ $t('trans.formViewer.no') }}</span>
        </template>
      </BaseDialog>
    </v-container>
  </v-skeleton-loader>
</template>

<style lang="scss" scoped>
.form-wrapper :deep(.formio-form) {
  &.formio-read-only {
    // in submission review mode, make readonly formio fields consistently greyed-out
    .form-control,
    .formio-component-simpletextarea .card-body.bg-light,
    .choices.is-disabled .choices__input {
      background-color: #e9ecef !important;
    }
    .formio-component-simpletextarea .card-body.bg-light {
      border: 1px solid #606060;
    }
  }
}
</style>
