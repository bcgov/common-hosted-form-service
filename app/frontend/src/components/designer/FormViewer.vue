<template>
  <div>
    <v-skeleton-loader :loading="loadingSubmission" type="article, actions">
      <div v-if="isFormScheduleExpired">
        <template>
          <v-alert text prominent type="error">
            {{
              isLateSubmissionAllowed
                ? 'The form submission period has expired! You can still create a late submission by clicking the button below.'
                : formScheduleExpireMessage
            }}
          </v-alert>
          <div v-if="isLateSubmissionAllowed">
            <v-col cols="3" md="2">
              <v-btn color="primary" @click="isFormScheduleExpired = false">
                <span>Create late submission</span>
              </v-btn>
            </v-col>
          </div>
        </template>
      </div>
      <div v-else>
        <div v-if="displayTitle">
          <div v-if="!isFormPublic(form)">
            <FormViewerActions
              :block="block"
              :draftEnabled="form.enableSubmitterDraft"
              :formId="form.id"
              :isDraft="submissionRecord.draft"
              :permissions="permissions"
              :readOnly="readOnly"
              :submissionId="submissionId"
              :allowSubmitterToUploadFile="allowSubmitterToUploadFile"
              :bulkFile="bulkFile"
              :copyExistingSubmission="form.enableCopyExistingSubmission"
              @showdoYouWantToSaveTheDraftModal="
                showdoYouWantToSaveTheDraftModal
              "
              @save-draft="saveDraft"
              @switchView="switchView"
            />
          </div>
          <h1 v-if="!bulkFile" class="my-6 text-center">{{ form.name }}</h1>
        </div>
        <div class="form-wrapper">
          <v-alert
            class="mt-2 mb-2"
            :value="saved || saving"
            :class="
              saving
                ? NOTIFICATIONS_TYPES.INFO.class
                : NOTIFICATIONS_TYPES.SUCCESS.class
            "
            :color="
              saving
                ? NOTIFICATIONS_TYPES.INFO.color
                : NOTIFICATIONS_TYPES.SUCCESS.color
            "
            :icon="
              saving
                ? NOTIFICATIONS_TYPES.INFO.icon
                : NOTIFICATIONS_TYPES.SUCCESS.icon
            "
            transition="scale-transition"
          >
            <div v-if="saving">
              <v-progress-linear indeterminate />
              Saving
            </div>
            <div v-else>Draft Saved</div>
          </v-alert>

          <slot name="alert" v-bind:form="form" />

          <BaseDialog
            v-model="showSubmitConfirmDialog"
            type="CONTINUE"
            :enableCustomButton="canSaveDraft"
            @close-dialog="showSubmitConfirmDialog = false"
            @continue-dialog="continueSubmit"
          >
            <template #title>Please Confirm</template>
            <template #text
              >Are you sure you wish to submit your form?</template
            >
            <template #button-text-continue>
              <span>Submit</span>
            </template>
          </BaseDialog>
          <v-alert
            v-if="isLoading && !bulkFile && submissionId == undefined"
            class="mt-2 mb-2"
            :value="isLoading"
            :class="NOTIFICATIONS_TYPES.INFO.class"
            :color="NOTIFICATIONS_TYPES.INFO.color"
            :icon="NOTIFICATIONS_TYPES.INFO.icon"
            transition="scale-transition"
          >
            <div color="info" icon="$info">
              <v-progress-linear
                :indeterminate="true"
                color="blue-grey lighten-4"
                height="5"
              ></v-progress-linear>
              Please wait while the form is loading !!!
            </div>
          </v-alert>
          <FormViewerMultiUpload
            v-if="!isLoading && allowSubmitterToUploadFile && bulkFile"
            :response="sbdMessage"
            :formElement="formElement"
            :form="form"
            :formSchema="formSchema"
            :json_csv="json_csv"
            @save-bulk-data="saveBulkData"
            @reset-message="resetMessage"
            @set-error="setError"
            :formFields="formFields"
          />
          <Form
            class="mt-4"
            v-if="!bulkFile"
            ref="chefForm"
            :form="formSchema"
            :key="reRenderFormIo"
            :submission="submission"
            :options="viewerOptions"
            @submit="onSubmit"
            @submitDone="onSubmitDone"
            @submitButton="onSubmitButton"
            @customEvent="onCustomEvent"
            @change="formChange"
            @render="onFormRender"
          />
          <p v-if="version" class="text-right">Version: {{ version }}</p>
        </div>
      </div>
      <YesOrNoDialog
        :doYouWantToSaveTheDraft="doYouWantToSaveTheDraft"
        @save-draft="saveDraftFromModal"
        @close-bulk-yes-or-no="closeBulkYesOrNo"
      />
    </v-skeleton-loader>
  </div>
</template>

<script>
import Vue from 'vue';
import { mapActions, mapGetters } from 'vuex';
import { Form } from 'vue-formio';
import templateExtensions from '@/plugins/templateExtensions';
import { formService, rbacService } from '@/services';
import FormViewerActions from '@/components/designer/FormViewerActions.vue';
import FormViewerMultiUpload from '@/components/designer/FormViewerMultiUpload.vue';
import { isFormPublic } from '@/utils/permissionUtils';
import { attachAttributesToLinks } from '@/utils/transformUtils';
import { FormPermissions, NotificationTypes } from '@/utils/constants';
import YesOrNoDialog from '@/components/designer/YesOrNoDialog.vue';

import _ from 'lodash';

export default {
  name: 'FormViewer',
  components: {
    YesOrNoDialog,
    Form,
    FormViewerActions,
    FormViewerMultiUpload,
  },
  props: {
    bulkState: String,
    displayTitle: {
      type: Boolean,
      default: false,
    },
    draftId: String,
    formId: String,
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
    submissionId: String,
    versionId: String,
    isDuplicate: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      confirmSubmit: false,
      currentForm: {},
      forceNewTabLinks: true,
      form: {},
      formSchema: {},
      loadingSubmission: false,
      permissions: [],
      reRenderFormIo: 0,
      saving: false,
      showSubmitConfirmDialog: false,
      submission: {
        data: { lateEntry: false },
      },
      submissionRecord: {},
      version: 0,
      versionIdToSubmitTo: this.versionId,
      allowSubmitterToUploadFile: false,
      formFields: [],
      json_csv: {
        data: [],
        file_name: String,
      },
      bulkFile: false,
      formElement: undefined,
      sbdMessage: {
        message: String,
        error: Boolean,
        upload_state: Number,
        response: [],
        file_name: String,
      },
      block: false,
      doYouWantToSaveTheDraft: false,
      isFormScheduleExpired: false,
      formScheduleExpireMessage:
        'Form submission is not available as the scheduled submission period has expired.',
      isLateSubmissionAllowed: false,
      saveDraftState: 0,
      formDataEntered: false,
      isLoading: true,
    };
  },
  computed: {
    ...mapGetters('auth', ['authenticated', 'token', 'tokenParsed', 'user']),
    NOTIFICATIONS_TYPES() {
      return NotificationTypes;
    },
    viewerOptions() {
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
            config: Vue.prototype.$config,
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
  methods: {
    ...mapActions('notifications', ['addNotification']),
    isFormPublic: isFormPublic,
    // setBulkFile
    setBulkFile(state) {
      this.bulkFile = state;
    },
    // Get the data for a form submission
    getCurrentAuthHeader() {
      return `Bearer ${this.token}`;
    },
    async getFormData() {
      function iterate(obj, stack, fields, propNeeded) {
        //Get property path from nested object
        for (let property in obj) {
          if (typeof obj[property] == 'object') {
            return iterate(
              obj[property],
              stack + '.' + property,
              fields,
              propNeeded
            );
          } else if (propNeeded === property) {
            fields = fields + stack + '.' + property;
            return fields;
          }
        }
      }

      function deleteFieldData(fieldcomponent, submission) {
        if (
          Object.prototype.hasOwnProperty.call(fieldcomponent, 'components')
        ) {
          fieldcomponent.components.map((subComponent) => {
            // Check if it's a Nested component
            deleteFieldData(subComponent, submission);
          });
        } else if (!fieldcomponent?.validate?.isUseForCopy) {
          _.unset(
            submission,
            iterate(submission, '', '', fieldcomponent.key).replace(/^\./, '')
          );
        }
      }

      try {
        this.loadingSubmission = true;
        const response = await formService.getSubmission(this.submissionId);
        this.submissionRecord = Object.assign({}, response.data.submission);
        this.submission = this.submissionRecord.submission;
        this.form = response.data.form;
        if (!this.isDuplicate) {
          //As we know this is a Submission from existing one so we will wait for the latest version to be set on the getFormSchema
          this.formSchema = response.data.version.schema;
          this.version = response.data.version.version;
        } else {
          /** Let's remove all the values of such components that are not enabled for Copy existing submission feature */
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
          message: 'An error occurred fetching the submission for this form',
          consoleError: `Error loading form submission data ${this.submissionId}: ${error}`,
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
              `No schema in response. VersionId: ${this.versionId}`
            );
          }
          this.form = response.data;
          this.formSchema = response.data.schema;
        } else if (this.draftId) {
          // If getting for a specific draft version of the form for preview
          response = await formService.readDraft(this.formId, this.draftId);
          if (!response.data || !response.data.schema) {
            throw new Error(`No schema in response. DraftId: ${this.draftId}`);
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
              params: {
                message:
                  'The form owner has not published the form, and it is not available for submissions.',
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
        this.listenFormChangeEvent(response);
      } catch (error) {
        if (this.authenticated) {
          this.isFormScheduleExpired = true;
          this.isLateSubmissionAllowed = false;
          this.formScheduleExpireMessage = error.message;
          this.addNotification({
            message: 'An error occurred fetching this form',
            consoleError: `Error loading form schema ${this.versionId}: ${error}`,
          });
        }
      }
    },
    async listenFormChangeEvent(response) {
      this.allowSubmitterToUploadFile =
        response.data.allowSubmitterToUploadFile;
      if (this.allowSubmitterToUploadFile && !this.draftId) this.jsonManager();
    },
    formChange(e) {
      if (e.changed != undefined && !e.changed.flags.fromSubmission) {
        this.formDataEntered = true;
      }
    },
    jsonManager() {
      this.formElement = this.$refs.chefForm.formio;
      this.json_csv.data = [this.formElement.data, this.formElement.data];
      this.json_csv.file_name = 'template_' + this.form.name + '_' + Date.now();
    },
    resetMessage() {
      this.sbdMessage.message = undefined;
      this.sbdMessage.error = false;
      this.sbdMessage.upload_state = 0;
      this.sbdMessage.response = [];
      this.sbdMessage.file_name = undefined;
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
          this.sbdMessage.message =
            'Your multiple draft upload has been successful!';
          this.sbdMessage.error = false;
          this.sbdMessage.upload_state = 10;
          this.sbdMessage.response = [];
          this.block = false;
          this.saving = false;
          this.addNotification({
            message: this.sbdMessage.message,
            ...NotificationTypes.SUCCESS,
          });
          this.leaveThisPage();
        } else {
          this.sbdMessage.message = `Failed response from submission endpoint. Response code: ${response.status}`;
          this.sbdMessage.error = true;
          this.sbdMessage.upload_state = 10;
          this.block = false;
          this.sbdMessage.response = [
            { error_message: 'An error occurred submitting this form' },
          ];
          this.sbdMessage.file_name =
            'error_report_' + this.form.name + '_' + Date.now();
          this.saving = false;
          throw new Error(
            `Failed response from submission endpoint. Response code: ${response.status}`
          );
        }
      } catch (error) {
        this.saving = false;
        this.block = false;
        this.setFinalError(error);
        this.addNotification({
          message: this.sbdMessage.message,
          consoleError: `Error saving files. Filename: ${this.json_csv.file_name}. Error: ${error}`,
        });
      }
    },
    async setFinalError(error) {
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
              : await this.formatResponse(error.response.data.reports);
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
    setError(data) {
      this.sbdMessage = data;
    },
    // Custom Event triggered from buttons with Action type "Event"
    async saveDraft() {
      try {
        this.saving = true;
        const response = await this.sendSubmission(true, this.submission);
        this.formDataEntered = false;
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
      } catch (error) {
        this.addNotification({
          message: 'An error occurred while saving a draft',
          consoleError: `Error saving draft. SubmissionId: ${this.submissionId}. Error: ${error}`,
        });
      }
    },
    async sendSubmission(isDraft, submission) {
      submission.data.lateEntry =
        this.form?.schedule?.expire !== undefined &&
        this.form.schedule.expire === true
          ? this.form.schedule.allowLateSubmissions
          : false;
      const body = {
        draft: isDraft,
        submission: submission,
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
        alert('Submission disabled during form preview');
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
    async onSubmit(submission) {
      if (this.preview) {
        alert('Submission disabled during form preview');
        return;
      }

      const errors = await this.doSubmit(submission);

      // if we are here, the submission has been saved to our db
      // the passed in submission is the formio submission, not our db persisted submission record...
      // fire off the submitDone event.
      // console.info(`onSubmit(${JSON.stringify(submission)})`) ; // eslint-disable-line no-console
      if (errors) {
        this.addNotification({
          message: errors,
          consoleError: `Error submiting the form: ${errors}`,
        });
      } else {
        this.currentForm.events.emit('formio.submitDone');
      }
    },

    // Not a formIO event, our saving routine to POST the submission to our API
    async doSubmit(submission) {
      // console.info(`doSubmit(${JSON.stringify(submission)})`) ; // eslint-disable-line no-console
      // since we are not using formio api
      // we should do the actual submit here, and return any error that occurrs to handle in the submit event
      let errMsg = undefined;
      try {
        const response = await this.sendSubmission(false, submission);

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
            `Failed response from submission endpoint. Response code: ${response.status}`
          );
        }
      } catch (error) {
        errMsg = 'An error occurred submitting this form';
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

    onCustomEvent(event) {
      alert(
        `Custom button events not supported yet. Event Type: ${event.type}`
      );
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
      if (this.formDataEntered) {
        this.doYouWantToSaveTheDraft = true;
      } else {
        this.leaveThisPage();
      }
    },
    showdoYouWantToSaveTheDraftModal() {
      if (!this.bulkFile) {
        this.saveDraftState = 0;
        if (this.submissionId == undefined || this.formDataEntered)
          this.doYouWantToSaveTheDraft = true;
        else this.leaveThisPage();
      } else {
        this.leaveThisPage();
      }
    },
    goTo(path, params) {
      this.$router.push({
        name: path,
        query: params,
      });
    },
    leaveThisPage() {
      if (this.saveDraftState == 0 || this.bulkFile) {
        this.goTo('UserSubmissions', { f: this.form.id });
      } else {
        this.bulkFile = !this.bulkFile;
      }
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
          message: 'An error occurred while saving a draft',
          consoleError: `Error saving draft. SubmissionId: ${this.submissionId}. Error: ${error}`,
        });
      }
    },
    closeBulkYesOrNo() {
      this.doYouWantToSaveTheDraft = false;
    },
    async init() {
      if (this.submissionId && this.isDuplicate) {
        //Run when make new submission from existing one called.
        await this.getFormData();
        //We need this to be called as well, because we need latest version of form
        await this.getFormSchema();
      } else if (this.submissionId && !this.isDuplicate) {
        await this.getFormData();
      } else {
        await this.getFormSchema();
      }
      if (!this.preview && !this.readOnly) {
        window.onbeforeunload = () => true;
      }
      this.resetMessage();
    },
  },
  async created() {
    this.init();
  },
  beforeUpdate() {
    // This needs to be ran whenever we have a formSchema change
    if (this.forceNewTabLinks) {
      attachAttributesToLinks(this.formSchema.components);
    }
  },
};
</script>

<style lang="scss" scoped>
@import '~font-awesome/css/font-awesome.min.css';
@import '~formiojs/dist/formio.form.min.css';

.form-wrapper ::v-deep .formio-form {
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
