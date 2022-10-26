<template>
  <v-container class="px-0">
    <v-row>
      <v-col cols="12" md="6">
        <BasePanel class="fill-height">
          <template #title>Form Title</template>
          <v-text-field
            dense
            flat
            solid
            outlined
            label="Form Title"
            data-test="text-name"
            v-model="name"
            :rules="nameRules"
          />

          <v-text-field
            dense
            flat
            solid
            outlined
            label="Form Description"
            data-test="text-description"
            v-model="description"
            :rules="descriptionRules"
          />
        </BasePanel>
      </v-col>

      <v-col cols="12" md="6">
        <BasePanel class="fill-height">
          <template #title>Form Access</template>
          <v-radio-group
            class="my-0"
            v-model="userType"
            :mandatory="false"
            :rules="loginRequiredRules"
            @change="userTypeChanged"
          >
            <v-radio
              class="mb-4"
              label="Public (anonymous)"
              :value="ID_MODE.PUBLIC"
            />
            <v-radio class="mb-4" label="Log-in Required" value="login" />
            <v-expand-transition>
              <v-row v-if="userType === ID_MODE.LOGIN" class="pl-6">
                <v-radio-group class="my-0" v-model="idps[0]">
                  <v-radio class="mx-2" label="IDIR" :value="ID_PROVIDERS.IDIR" />
                  <v-radio
                    class="mx-2"
                    label="Basic BCeID"
                    :value="ID_PROVIDERS.BCEIDBASIC"
                  />
                  <v-radio
                    class="mx-2"
                    label="Business BCeID"
                    :value="ID_PROVIDERS.BCEIDBUSINESS"
                  />
                  <!-- Mandatory BCeID process notification -->
                  <v-expand-transition>
                    <BaseInfoCard
                      v-if="idps[0] && [ID_PROVIDERS.BCEIDBASIC, ID_PROVIDERS.BCEIDBUSINESS].includes(idps[0])"
                      class="mr-4"
                    >
                      <h4 class="primary--text">
                        <v-icon class="mr-1" color="primary">info</v-icon>IMPORTANT!
                      </h4>
                      <p class="my-2">
                        You must notify the Identity Information Management (IDIM)
                        team by email (<a href="mailto:IDIM.Consulting@gov.bc.ca"
                        >IDIM.Consulting@gov.bc.ca</a
                        >) your intent to leverage BCeID to verify the identities of
                        your form submitters.
                      </p>
                      <p class="mt-2 mb-0">
                        Please reference our
                        <a
                          href="https://github.com/bcgov/common-hosted-form-service/wiki/Accessing-forms#Notify-the-idim-team-if-you-are-using-bceid"
                        >user guide</a
                        >
                        for more details.
                      </p>
                    </BaseInfoCard>
                  </v-expand-transition>
                </v-radio-group>
              </v-row>
            </v-expand-transition>
            <v-radio
              label="Specific Team Members (You can specify users on the form's management screen once created.)"
              value="team"
            />
          </v-radio-group>
        </BasePanel>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <BasePanel class="fill-height">
          <template #title>Form Functionality</template>
          <v-checkbox
            class="my-0"
            v-model="enableSubmitterDraft"
            :disabled="userType === ID_MODE.PUBLIC"
          >
            <template #label>
              <span>
                Submitters can
                <strong>Save and Edit Drafts</strong>
              </span>
            </template>
          </v-checkbox>

          <v-checkbox class="my-0" v-model="enableStatusUpdates">
            <template #label>
              <span>
                Reviewers can <strong>Update the Status</strong> of this form
                (i.e. Submitted, Assigned, Completed)
              </span>
            </template>
          </v-checkbox>

          <v-checkbox v-if="!isFormPublished" disabled class="my-0">
            <template #label>
              Schedule form submission will be available in the Form settings after the
              form published.
            </template>
          </v-checkbox>

          <v-checkbox v-if="isFormPublished" class="my-0" v-model="schedule.enabled">
            <template #label>
              Enable this form for schedule settings.
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon color="primary" class="ml-3" v-bind="attrs" v-on="on">
                    help_outline
                  </v-icon>
                </template>
                <span>
                  Selecting this option controls this form to be open or close
                  for a given period.<br />
                  If checked, it will display form schedule section where you can
                  <ul>
                    <li>Set form submissions open and close date</li>
                    <li>Set form recurrence settings</li>
                  </ul>
                </span>
              </v-tooltip>
            </template>
          </v-checkbox>
        </BasePanel>
      </v-col>

      <v-col cols="12" md="6">
        <BasePanel class="fill-height">
          <template #title>After Submission</template>
          <v-checkbox class="my-0" v-model="showSubmissionConfirmation">
            <template #label>
              Show the submission confirmation details
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon color="primary" class="ml-3" v-bind="attrs" v-on="on">
                    help_outline
                  </v-icon>
                </template>
                <span>
                  Selecting this option controls what the submitting user of
                  this form will see on successful submission. <br />
                  If checked, it will display
                  <ul>
                    <li>the Confirmation ID</li>
                    <li>
                      the option for the user to email themselves a submission
                      confirmation
                    </li>
                  </ul>
                </span>
              </v-tooltip>
            </template>
          </v-checkbox>

          <v-checkbox class="my-0" v-model="sendSubRecieviedEmail">
            <template #label>
              Send my team a notification email
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon color="primary" class="ml-3" v-bind="attrs" v-on="on">
                    help_outline
                  </v-icon>
                </template>
                <span>
                  Send a notification to your specified email address when any
                  user submits this form
                </span>
              </v-tooltip>
            </template>
          </v-checkbox>

          <v-combobox
            v-if="sendSubRecieviedEmail"
            v-model="submissionReceivedEmails"
            :rules="emailArrayRules"
            dense
            flat
            solid
            outlined
            hide-selected
            clearable
            hint="Add one or more valid email addresses"
            label="Notification Email Addresses"
            multiple
            small-chips
            deletable-chips
            :delimiters="[' ', ',']"
            append-icon=""
          >
            <template v-slot:no-data>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>
                    Press <kbd>enter</kbd> or <kbd>,</kbd> or
                    <kbd>space</kbd> to add multiple email addresses
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </template>
          </v-combobox>
        </BasePanel>
      </v-col>

      <v-expand-transition>
        <v-col cols="12" md="6" v-if="schedule.enabled && isFormPublished">
          <BasePanel class="fill-height">
            <template #title>Form Schedule Settings</template>
            <v-row class="m-0">
              <v-col cols="4" md="4" class="pl-0 pr-0 pb-0">
                <v-menu
                  v-model="openSubmissionDateDraw"
                  data-test="menu-form-openSubmissionDateDraw"
                  :close-on-content-click="false"
                  :nudge-right="40"
                  transition="scale-transition"
                  offset-y
                  min-width="290px"
                >
                  <template v-slot:activator="{ on }">
                    <v-text-field
                      v-model="schedule.openSubmissionDateTime"
                      placeholder="yyyy-mm-dd"
                      append-icon="event"
                      v-on:click:append="openSubmissionDateDraw = true"
                      readonly
                      label="Open submission date"
                      v-on="on"
                      dense
                      outlined
                      :rules="scheduleOpenDate"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="schedule.openSubmissionDateTime"
                    data-test="picker-form-openSubmissionDateDraw"
                    @input="openSubmissionDateDraw = false"
                  ></v-date-picker>
                </v-menu>
              </v-col>

              <v-col cols="4" md="4" class="pr-0 pb-0">
                <v-text-field
                  label="Keep open for"
                  value="0"
                  type="number"
                  dense
                  flat
                  solid
                  outlined
                  v-model="schedule.keepOpenForTerm"
                  class="m-0 p-0"
                  :rules="roundNumber"
                ></v-text-field>
              </v-col>

              <v-col cols="4" md="4" class="pl-0 pr-0 pb-0">
                <v-select
                  :items="['days','weeks','months','quarters','years']"
                  label="Period"
                  dense
                  flat
                  solid
                  outlined
                  class="mr-2 pl-2"
                  v-model="schedule.keepOpenForInterval"
                  :rules="intervalType"
                ></v-select>
              </v-col>
            </v-row>

            <v-checkbox class="my-0 m-0 p-0" v-model="schedule.allowLateSubmissions.enabled">
              <template #label>
                Allow late submissions
              </template>
            </v-checkbox>

            <v-expand-transition v-if="schedule.allowLateSubmissions.enabled" class="pl-3 ">
              <v-row class="m-0">
                <v-col cols="6" class="m-0 p-0">
                  <v-text-field
                    label="After close date for"
                    value="0"
                    type="number"
                    dense
                    flat
                    solid
                    outlined
                    v-model="schedule.allowLateSubmissions.forNext.term"
                    class="m-0 p-0"
                    :rules="roundNumber"
                  ></v-text-field>
                </v-col>
                <v-col cols="6" class="m-0 p-0">
                  <v-select
                    :items="['days','weeks','months','quarters','years']"
                    label="Period"
                    dense
                    flat
                    solid
                    outlined
                    class="mr-1 pl-2"
                    v-model="schedule.allowLateSubmissions.forNext.intervalType"
                    :rules="intervalType"
                  ></v-select>
                </v-col>
              </v-row>
            </v-expand-transition>

            <v-checkbox class="my-0 pt-0" v-model="schedule.repeatSubmission.enabled">
              <template #label>
                Repeat submission
              </template>
            </v-checkbox>

            <v-expand-transition v-if="schedule.repeatSubmission.enabled">
              <v-row class="m-0">

                <v-col cols="4" class="m-0 p-0">
                  <v-text-field
                    label="Every"
                    value="0"
                    type="number"
                    dense
                    flat
                    solid
                    outlined
                    v-model="schedule.repeatSubmission.everyTerm"
                    class="m-0 p-0"
                    :rules="repeatTerm"
                  ></v-text-field>
                </v-col>

                <v-col cols="4" class="m-0 p-0">
                  <v-select
                    :items="AVAILABLE_PERIOD_OPTIONS"
                    label="Period"
                    dense
                    flat
                    solid
                    outlined
                    class="mr-2 pl-2"
                    v-model="schedule.repeatSubmission.everyIntervalType"
                    :rules="repeatIntervalType"
                  ></v-select>
                </v-col>

                <v-col cols="4" class="m-0 p-0">
                  <v-menu
                    v-model="repeatUntil"
                    data-test="menu-form-repeatUntil"
                    :close-on-content-click="false"
                    :nudge-right="40"
                    transition="scale-transition"
                    offset-y
                    min-width="290px"

                  >
                    <template v-slot:activator="{ on }">
                      <v-text-field
                        v-model="schedule.repeatSubmission.repeatUntil"
                        placeholder="yyyy-mm-dd"
                        append-icon="event"
                        v-on:click:append="repeatUntil = true"
                        readonly
                        label="Repeat until"
                        v-on="on"
                        dense
                        outlined
                        :rules="repeatUntilDate"
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="schedule.repeatSubmission.repeatUntil"
                      data-test="picker-form-repeatUntil"
                      @input="repeatUntil = false"
                    ></v-date-picker>
                  </v-menu>

                </v-col>

              </v-row>
            </v-expand-transition>

            <!-- NEW FEATURE ADD BY ASGARD -->
            <v-checkbox class="my-0 m-0 p-0" v-if="this.userType ==='team'" v-model="reminder.enabled">
              <template #label>
                Enable automatic reminder notification
              </template>
            </v-checkbox>

            <v-row class="mb-0 mt-0">
              <v-col class="mb-0 mt-0 pb-0 pt-0">
                <template #title>Closing Message</template>
                <v-textarea
                  dense
                  rows="2"
                  flat
                  solid
                  outlined
                  label="Closing Message"
                  data-test="text-name"
                  v-model="schedule.closingMessage"
                  :rules="closeMessage"
                />
              </v-col>
            </v-row>

            <v-row class="p-0 m-0" v-if="schedule.enabled && schedule.openSubmissionDateTime && schedule.openSubmissionDateTime.length">
              <v-col class="p-0 m-0" cols="12" md="12">Summary of schedule setup:</v-col>

              <v-col class="p-0 m-0" cols="12" md="12" v-if="schedule.openSubmissionDateTime && schedule.openSubmissionDateTime.length">Form submission will be be open on
                <b>{{schedule.openSubmissionDateTime}}</b>
              </v-col>

              <v-col class="p-0 m-0" cols="12" md="12" v-if="schedule.enabled && schedule.allowLateSubmissions.enabled && schedule.allowLateSubmissions.forNext.term && schedule.allowLateSubmissions.forNext.intervalType">Form submission will be allowed for late submission after the close date for
                <b>{{schedule.allowLateSubmissions.forNext.term}} {{schedule.allowLateSubmissions.forNext.intervalType}} </b>
              </v-col><br />

              <v-col class="p-0 m-0" cols="12" md="12" v-if="schedule.repeatSubmission.enabled && schedule.repeatSubmission.everyTerm && schedule.repeatSubmission.repeatUntil && schedule.repeatSubmission.everyIntervalType">Form submission will be repeated
                <b>every {{schedule.repeatSubmission.everyTerm}} {{schedule.repeatSubmission.everyIntervalType}}</b> and wil be repeat until
                <b>{{schedule.repeatSubmission.repeatUntil}}</b>

                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-icon color="primary" class="ml-3" v-bind="attrs" v-on="on">
                      help_outline
                    </v-icon>
                  </template>
                  <span>
                    As per the settings these are the available dates of submissions:
                    <ul >
                      <li :key="date.startDate+Math.random()" v-for="date in AVAILABLE_DATES">From {{ date.startDate.split(" ")[0] }} <span v-if="schedule.enabled"> to {{ date.closeDate.split(" ")[0] }} <span v-if="schedule.allowLateSubmissions.enabled && date.closeDate !== date.graceDate">with late submission untill {{date.graceDate.split(" ")[0]}}</span></span></li>
                    </ul>
                  </span>
                </v-tooltip>
              </v-col>
            </v-row>

          </BasePanel>
        </v-col>
      </v-expand-transition>

    </v-row>
  </v-container>
</template>

<script>
import { mapActions } from 'vuex';
import { mapFields } from 'vuex-map-fields';
import { IdentityMode, IdentityProviders, Regex } from '@/utils/constants';
import { getAvailableDates } from '@/utils/permissionUtils';
import moment from 'moment';

export default {
  name: 'FormSettings',
  props: {
    formId: String,
  },
  data() {
    return {
      repeatUntil:false,
      closeSubmissionDateDraw:false,
      openSubmissionDateDraw:false,
      valid: false,
      // Validation
      loginRequiredRules: [
        (v) =>
          v !== 'login' ||
          this.idps.length === 1 ||
          'Please select 1 log-in type',
      ],
      descriptionRules: [
        (v) =>
          !v ||
          v.length <= 255 ||
          'Form Description must be 255 characters or less',
      ],
      nameRules: [
        (v) => !!v || 'Form Title is required',
        (v) =>
          (v && v.length <= 255) || 'Form Title must be 255 characters or less',
      ],
      emailArrayRules: [
        (v) =>
          !this.sendSubRecieviedEmail ||
          v.length > 0 ||
          'Please enter at least 1 email address',
        (v) =>
          !this.sendSubRecieviedEmail ||
          v.every((item) => new RegExp(Regex.EMAIL).test(item)) ||
          'Please enter all valid email addresses',
      ],
      scheduleOpenDate: [
        (v) => !!v || 'This field is required & should be valid date.',
      ],
      roundNumber: [
        (v) => !!v || 'This field is required & should be an integer.',
        (v) => (v && new RegExp(/^[+]?\d+(\d+)?$/g).test(v)) || 'Value must be an integer. ie. 1,2,3,5,99'
      ],
      repeatTerm: [
        (v) => !!v || 'This field is required & should be an integer.',
        (v) => (v && new RegExp(/^[+]?\d+(\d+)?$/g).test(v)) || 'Value must be an integer. ie. 1,2,3,5,99'
      ],
      intervalType: [
        (v) => !!v || 'This field is required & should be an interval.',
      ],
      repeatIntervalType: [
        (v) => !! v || 'This field is required & should be an interval.',
        (v) => this.AVAILABLE_PERIOD_OPTIONS.includes(v) || 'This field is required & should be a valid interval.',
      ],
      repeatIntervalTypeReminder: [
        (v) => !! v || 'This field is required & should be an interval.',
        (v) => this.AVAILABLE_PERIOD_INTERVAL.includes(v) || 'This field is required & should be a valid interval.',
      ],
      closeMessage: [
        (v) => !!v || 'This field is required.',
      ],
      repeatUntilDate: [
        (v) => !!v || 'This field is required & should be valid date.',
      ]
    };
  },
  computed: {
    ...mapFields('form', [
      'form.description',
      'form.enableSubmitterDraft',
      'form.enableStatusUpdates',
      'form.id',
      'form.idps',
      'form.name',
      'form.sendSubRecieviedEmail',
      'form.showSubmissionConfirmation',
      'form.submissionReceivedEmails',
      'form.userType',
      'form.schedule',
      'form.reminder',
      'form.versions'
    ]),
    ID_MODE() {
      return IdentityMode;
    },
    ID_PROVIDERS() {
      return IdentityProviders;
    },
    isFormPublished() {
      return (
        this.versions &&
        this.versions.length &&
        this.versions.some((v) => v.published)
      );
    },
    AVAILABLE_DATES() { //return [];
      return getAvailableDates(
        this.schedule.keepOpenForTerm,
        this.schedule.keepOpenForInterval,
        this.schedule.openSubmissionDateTime,
        this.schedule.repeatSubmission.everyTerm,
        this.schedule.repeatSubmission.everyIntervalType,
        this.schedule.allowLateSubmissions.forNext.term,
        this.schedule.allowLateSubmissions.forNext.intervalType,
        this.schedule.repeatSubmission.repeatUntil,
      );
    },
    AVAILABLE_PERIOD_OPTIONS() {
      var arrayOfption =  ['weeks','months','quarters','years'];
      var diffInDays = 0;
      if(this.schedule.openSubmissionDateTime && this.schedule.keepOpenForInterval && this.schedule.keepOpenForTerm){
        diffInDays = moment.duration({[this.schedule.keepOpenForInterval]: this.schedule.keepOpenForTerm}).asDays();// moment.duration(this.schedule.keepOpenForTerm, this.schedule.keepOpenForInterval).days();

        if(this.schedule.allowLateSubmissions.enabled && this.schedule.allowLateSubmissions.forNext.term && this.schedule.allowLateSubmissions.forNext.intervalType){
          let durationoflatesubInDays = 0;
          if(this.schedule.allowLateSubmissions.forNext.intervalType === 'days'){
            durationoflatesubInDays = this.schedule.allowLateSubmissions.forNext.term;
          }else{
            durationoflatesubInDays = moment.duration({[this.schedule.allowLateSubmissions.forNext.intervalType]: this.schedule.allowLateSubmissions.forNext.term}).asDays();
          }

          diffInDays = Number(diffInDays)+Number(durationoflatesubInDays);
        }
      }

      switch (true) {
        case (diffInDays > 7 && diffInDays <= 30):
          arrayOfption = ['months','quarters','years'];
          break;

        case (diffInDays > 30 && diffInDays <= 91):
          arrayOfption = ['quarters','years'];
          break;

        case (diffInDays > 91):
          arrayOfption = ['years'];
          break;

        default:
          arrayOfption = ['weeks','months','quarters','years'];
          break;
      }
      return arrayOfption;
    },
    INTERVAL_OPEN() {
      return  moment.duration({[this.schedule.keepOpenForInterval]: this.schedule.keepOpenForTerm}).asDays();
    },
    AVAILABLE_PERIOD_INTERVAL() {
      var arrayOfption =  ['Daily','Weekly','Bi-weekly','Monthly','Quarterly','Semi-Annually','Annually'];

      var diffInDays = this.INTERVAL_OPEN;
      switch (true) {
        case (diffInDays <= 7):
          arrayOfption = ['Daily'];
          break;
        case (diffInDays > 7 && diffInDays <= 14):
          arrayOfption = ['Daily','Weekly'];
          break;
        case (diffInDays > 14 && diffInDays <= 31):
          arrayOfption = ['Daily','Weekly','Bi-weekly'];
          break;
        case (diffInDays > 31 && diffInDays <= 91):
          arrayOfption = ['Daily','Weekly','Bi-weekly','Monthly'];
          break;
        case (diffInDays > 91 && diffInDays <= 183):
          arrayOfption = ['Daily','Weekly','Bi-weekly','Monthly','Quarterly'];
          break;
        case (diffInDays > 183 && diffInDays <= 365):
          arrayOfption = ['Daily','Weekly','Bi-weekly','Monthly','Quarterly','Semi-Annually'];
          break;
        default:
          arrayOfption =  ['Daily','Weekly','Bi-weekly','Monthly','Quarterly','Semi-Annually','Annually'];
          break;
      }
      return arrayOfption;
    }
  },
  watch: {
    INTERVAL_OPEN: {
      deep: true,
      handler: function (day) {
        this.reminder.allowAdditionalNotifications = (day<=1) ? false : this.reminder.allowAdditionalNotifications;
      }
    }
  },
  methods: {
    ...mapActions('form', ['fetchForm']),
    userTypeChanged() {
      // if they checked enable drafts then went back to public, uncheck it
      if (this.userType === this.ID_MODE.PUBLIC) {
        this.enableSubmitterDraft = false;
      }
      if (this.userType !== 'team') {
        this.reminder = {};
      }

    },
    getTotalDay(){
      ['weeks','months','quarters','years'];
    }
  },
};
</script>
