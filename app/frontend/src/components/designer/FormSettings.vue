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
            <v-expand-transition>
              <BaseInfoCard v-if="userType == ID_MODE.PUBLIC" class="mr-4 mb-3">
                <h4 class="primary--text">
                  <v-icon class="mr-1" color="primary">info</v-icon>IMPORTANT!
                </h4>
                <p class="mt-2 mb-0">
                  If you will be using this form to gather information from the
                  general public on topics that are of general interest to the
                  public, you are required to contact the GCPE so that your
                  engagement can be listed on
                  <a
                    href="https://engage.gov.bc.ca/govtogetherbc/"
                    target="_blank"
                  >
                    govTogetherBC.
                    <v-icon small color="primary">open_in_new</v-icon>
                  </a>
                </p>
              </BaseInfoCard>
            </v-expand-transition>
            <v-radio class="mb-4" label="Log-in Required" value="login" />
            <v-expand-transition>
              <v-row v-if="userType === ID_MODE.LOGIN" class="pl-6">
                <v-radio-group class="my-0" v-model="idps[0]">
                  <v-radio
                    class="mx-2"
                    label="IDIR"
                    :value="ID_PROVIDERS.IDIR"
                  />
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
                      v-if="
                        idps[0] &&
                        [
                          ID_PROVIDERS.BCEIDBASIC,
                          ID_PROVIDERS.BCEIDBUSINESS,
                        ].includes(idps[0])
                      "
                      class="mr-4"
                    >
                      <h4 class="primary--text">
                        <v-icon class="mr-1" color="primary">info</v-icon
                        >IMPORTANT!
                      </h4>
                      <p class="my-2">
                        You must notify the Identity Information Management
                        (IDIM) team by email (<a
                          href="mailto:IDIM.Consulting@gov.bc.ca"
                          >IDIM.Consulting@gov.bc.ca</a
                        >) your intent to leverage BCeID to verify the
                        identities of your form submitters.
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
            @change="enableSubmitterDraftChanged"
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

          <v-checkbox
            @change="allowSubmitterToUploadFileChanged"
            class="my-0"
            v-model="allowSubmitterToUploadFile"
          >
            <template #label>
              <span>
                Allow <strong> multiple draft</strong> upload
                <v-tooltip close-delay="3000" bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <font-awesome-icon
                      icon="fa-solid fa-flask"
                      color="primary"
                      class="ml-3"
                      v-bind="attrs"
                      v-on="on"
                    />
                  </template>
                  <span
                    >Experimental
                    <a
                      :href="githubLinkBulkUpload"
                      class="preview_info_link_field_white"
                      :target="'_blank'"
                    >
                      Learn more
                      <font-awesome-icon
                        icon="fa-solid fa-square-arrow-up-right"
                    /></a>
                  </span>
                </v-tooltip>
              </span>
            </template>
          </v-checkbox>

          <v-checkbox v-if="!isFormPublished" disabled class="my-0">
            <template #label>
              The Form Submissions Schedule will be available in the Form
              Settings after the form is published.
            </template>
          </v-checkbox>

          <v-checkbox
            v-if="isFormPublished"
            class="my-0"
            v-model="schedule.enabled"
          >
            <template #label>
              Form Submissions Schedule
              <v-tooltip bottom close-delay="2500">
                <template v-slot:activator="{ on, attrs }">
                  <font-awesome-icon
                    icon="fa-solid fa-flask"
                    color="primary"
                    class="ml-3"
                    v-bind="attrs"
                    v-on="on"
                  />
                </template>
                <span
                  >Experimental
                  <a
                    :href="githubLinkScheduleAndReminderFeature"
                    class="preview_info_link_field_white"
                    :target="'_blank'"
                  >
                    Learn more
                    <font-awesome-icon
                      icon="fa-solid fa-square-arrow-up-right" /></a
                ></span>
              </v-tooltip>
            </template>
          </v-checkbox>

          <v-checkbox
            class="my-0"
            v-model="enableCopyExistingSubmission"
            :disabled="userType === ID_MODE.PUBLIC"
          >
            <template #label>
              <span
                >Submitters can
                <strong>Copy an existing submission</strong></span
              >
              <v-tooltip bottom close-delay="2500">
                <template v-slot:activator="{ on, attrs }">
                  <font-awesome-icon
                    icon="fa-solid fa-flask"
                    color="primary"
                    class="ml-3"
                    v-bind="attrs"
                    v-on="on"
                  />
                </template>
                <span
                  >Experimental
                  <a
                    :href="githubLinkCopyFromExistingFeature"
                    class="preview_info_link_field_white"
                    :target="'_blank'"
                  >
                    Learn more
                    <font-awesome-icon
                      icon="fa-solid fa-square-arrow-up-right" /></a
                ></span>
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
              <v-col cols="8" md="8" class="pl-0 pr-0 pb-0">
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
                      label="Open submissions"
                      v-on="on"
                      dense
                      outlined
                      :rules="scheduleOpenDate"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    @change="openDateTypeChanged"
                    v-model="schedule.openSubmissionDateTime"
                    data-test="picker-form-openSubmissionDateDraw"
                    @input="openSubmissionDateDraw = false"
                  >
                  </v-date-picker>
                </v-menu>
              </v-col>

              <v-col cols="12" md="12" class="p-0">
                <template>
                  <p class="font-weight-black">
                    How long do you want to receive submissions?
                  </p>
                </template>
                <v-expand-transition>
                  <v-row>
                    <v-radio-group
                      class="my-0"
                      v-model="schedule.scheduleType"
                      :rules="scheduleTypedRules"
                      @change="scheduleTypeChanged"
                    >
                      <v-radio
                        class="mx-2"
                        label="Keep open until manually unpublished"
                        :value="SCHEDULE_TYPE.MANUAL"
                      />
                      <v-radio
                        class="mx-2"
                        label="Schedule a closing date"
                        :value="SCHEDULE_TYPE.CLOSINGDATE"
                      />
                      <v-radio
                        class="mx-2"
                        label="Set up submission period"
                        :value="SCHEDULE_TYPE.PERIOD"
                      />
                    </v-radio-group>
                  </v-row>
                </v-expand-transition>
              </v-col>

              <v-col
                cols="8"
                md="8"
                class="pl-0 pr-0 pb-0"
                v-if="schedule.scheduleType === SCHEDULE_TYPE.CLOSINGDATE"
              >
                <v-menu
                  v-model="closeSubmissionDateDraw"
                  data-test="menu-form-closeSubmissionDateDraw"
                  :close-on-content-click="false"
                  :nudge-right="40"
                  transition="scale-transition"
                  offset-y
                  min-width="290px"
                >
                  <template v-slot:activator="{ on }">
                    <v-text-field
                      v-model="schedule.closeSubmissionDateTime"
                      placeholder="yyyy-mm-dd"
                      append-icon="event"
                      v-on:click:append="closeSubmissionDateDraw = true"
                      label="Close submissions"
                      v-on="on"
                      dense
                      outlined
                      :rules="scheduleCloseDate"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="schedule.closeSubmissionDateTime"
                    data-test="picker-form-closeSubmissionDateDraw"
                    @input="closeSubmissionDateDraw = false"
                  >
                  </v-date-picker>
                </v-menu>
              </v-col>

              <v-col
                cols="4"
                md="4"
                class="pl-0 pr-0 pb-0"
                v-if="schedule.scheduleType === SCHEDULE_TYPE.PERIOD"
              >
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

              <v-col
                cols="4"
                md="4"
                class="pl-0 pr-0 pb-0"
                v-if="schedule.scheduleType === SCHEDULE_TYPE.PERIOD"
              >
                <v-select
                  :items="['days', 'weeks', 'months', 'quarters', 'years']"
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

            <v-checkbox
              class="my-0 m-0 p-0"
              v-model="schedule.allowLateSubmissions.enabled"
              v-if="
                [SCHEDULE_TYPE.CLOSINGDATE, SCHEDULE_TYPE.PERIOD].includes(
                  schedule.scheduleType
                )
              "
              :rules="allowLateSubmissionRule"
            >
              <template #label>
                Allow late submissions
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-icon
                      color="primary"
                      class="ml-3"
                      v-bind="attrs"
                      v-on="on"
                    >
                      help_outline
                    </v-icon>
                  </template>
                  <span>
                    If checked, submitters will be able to submit data after the
                    closing date.
                  </span>
                </v-tooltip>
              </template>
            </v-checkbox>

            <v-expand-transition
              v-if="
                schedule.allowLateSubmissions.enabled &&
                [SCHEDULE_TYPE.CLOSINGDATE, SCHEDULE_TYPE.PERIOD].includes(
                  schedule.scheduleType
                )
              "
              class="pl-3"
            >
              <v-row class="m-0">
                <v-col cols="4" md="4" class="m-0 p-0">
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
                  >
                  </v-text-field>
                </v-col>
                <v-col cols="4" md="4" class="m-0 p-0">
                  <v-select
                    :items="['days', 'weeks', 'months', 'quarters', 'years']"
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

            <v-checkbox
              class="my-0 pt-0"
              @change="repeatSubmissionChanged"
              v-model="schedule.repeatSubmission.enabled"
              v-if="schedule.scheduleType === SCHEDULE_TYPE.PERIOD"
            >
              <template #label> Repeat period </template>
            </v-checkbox>

            <v-expand-transition
              v-if="
                schedule.scheduleType === SCHEDULE_TYPE.PERIOD &&
                schedule.repeatSubmission.enabled
              "
            >
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

            <v-row
              class="p-0 m-0"
              v-if="
                schedule.enabled &&
                schedule.openSubmissionDateTime &&
                schedule.openSubmissionDateTime.length &&
                (schedule.scheduleType === SCHEDULE_TYPE.CLOSINGDATE
                  ? schedule.closeSubmissionDateTime &&
                    schedule.closeSubmissionDateTime.length
                  : true) &&
                [SCHEDULE_TYPE.CLOSINGDATE, SCHEDULE_TYPE.PERIOD].includes(
                  schedule.scheduleType
                )
              "
            >
              <v-col class="p-0 m-0" cols="12" md="12"
                ><template>
                  <p class="font-weight-black m-0">Summary</p>
                </template></v-col
              >

              <v-col
                class="p-0 m-0"
                cols="12"
                md="12"
                v-if="
                  schedule.openSubmissionDateTime &&
                  schedule.openSubmissionDateTime.length
                "
                >This form will be open for submissions from
                <b>{{ schedule.openSubmissionDateTime }}</b> to
                <b>
                  {{
                    schedule.scheduleType === SCHEDULE_TYPE.PERIOD
                      ? AVAILABLE_DATES &&
                        AVAILABLE_DATES[0] &&
                        AVAILABLE_DATES[0]['closeDate'] &&
                        AVAILABLE_DATES[0]['closeDate'].split(' ')[0]
                      : ''
                  }}

                  {{
                    schedule.scheduleType === SCHEDULE_TYPE.CLOSINGDATE
                      ? schedule.closeSubmissionDateTime
                      : ''
                  }}
                </b>

                <span>{{
                  schedule.allowLateSubmissions.enabled &&
                  schedule.allowLateSubmissions.forNext.intervalType &&
                  schedule.allowLateSubmissions.forNext.term
                    ? ', allowing late submissions for ' +
                      schedule.allowLateSubmissions.forNext.term +
                      ' ' +
                      schedule.allowLateSubmissions.forNext.intervalType +
                      '.'
                    : '. '
                }}</span>

                <span
                  v-if="
                    schedule.scheduleType === SCHEDULE_TYPE.PERIOD &&
                    schedule.repeatSubmission.enabled === true &&
                    schedule.repeatSubmission.everyTerm &&
                    schedule.repeatSubmission.repeatUntil &&
                    schedule.repeatSubmission.everyIntervalType &&
                    AVAILABLE_DATES[1]
                  "
                  >The schedule will repeat every
                  <b>{{ schedule.repeatSubmission.everyTerm }} </b>
                  <b>{{ schedule.repeatSubmission.everyIntervalType }}</b> until
                  <b>{{ schedule.repeatSubmission.repeatUntil }}</b
                  >.
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-icon
                        color="primary"
                        class="ml-3"
                        v-bind="attrs"
                        v-on="on"
                      >
                        help_outline
                      </v-icon>
                    </template>
                    <span>
                      <!-- MORE FUTURE OCCURENCES -->
                      As per the settings these are the available dates of
                      submissions:
                      <ul>
                        <li
                          :key="date.startDate + Math.random()"
                          v-for="date in AVAILABLE_DATES"
                        >
                          This form will be open for submissions from
                          {{ date.startDate.split(' ')[0] }}
                          <span v-if="schedule.enabled">
                            to {{ date.closeDate.split(' ')[0] }}
                            <span
                              v-if="
                                schedule.allowLateSubmissions.enabled &&
                                date.closeDate !== date.graceDate
                              "
                              >with allowing late submission until
                              {{ date.graceDate.split(' ')[0] }}</span
                            ></span
                          >
                        </li>
                      </ul>
                    </span>
                  </v-tooltip>
                </span>
              </v-col>
            </v-row>

            <hr
              v-if="
                [SCHEDULE_TYPE.CLOSINGDATE, SCHEDULE_TYPE.PERIOD].includes(
                  schedule.scheduleType
                ) ||
                (this.userType === 'team' &&
                  schedule.scheduleType !== null &&
                  enableReminderDraw &&
                  schedule.openSubmissionDateTime)
              "
            />

            <v-row
              class="p-0 m-0"
              v-if="
                [SCHEDULE_TYPE.CLOSINGDATE, SCHEDULE_TYPE.PERIOD].includes(
                  schedule.scheduleType
                )
              "
            >
              <v-col cols="12" md="12" class="p-0">
                <v-checkbox
                  class="my-0 pt-0"
                  v-model="schedule.closingMessageEnabled"
                >
                  <template #label>
                    Set custom closing message
                    <v-tooltip bottom>
                      <template v-slot:activator="{ on, attrs }">
                        <v-icon
                          color="primary"
                          class="ml-3"
                          v-bind="attrs"
                          v-on="on"
                        >
                          help_outline
                        </v-icon>
                      </template>
                      <span>
                        Allow you to add a customized message for your users
                        when they visit a closed form.
                      </span>
                    </v-tooltip>
                  </template>
                </v-checkbox>
              </v-col>

              <v-col cols="12" md="12" class="p-0">
                <v-expand-transition v-if="schedule.closingMessageEnabled">
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
                </v-expand-transition>
              </v-col>
            </v-row>

            <v-row class="p-0 m-0">
              <v-col cols="12" md="12" class="p-0">
                <v-expand-transition
                  v-if="
                    this.userType === 'team' &&
                    schedule.scheduleType !== null &&
                    enableReminderDraw &&
                    schedule.openSubmissionDateTime
                  "
                >
                  <v-row class="mb-0 mt-0">
                    <v-col class="mb-0 mt-0 pb-0 pt-0">
                      <template #title>SEND Reminder email</template>
                      <v-checkbox
                        class="my-0 m-0 p-0"
                        v-model="reminder_enabled"
                      >
                        <template #label>
                          Enable automatic reminder notification
                          <v-tooltip close-delay="2500" bottom>
                            <template v-slot:activator="{ on, attrs }">
                              <v-icon
                                color="primary"
                                class="ml-3"
                                v-bind="attrs"
                                v-on="on"
                              >
                                help_outline
                              </v-icon>
                            </template>
                            <span>
                              Send reminder email/s with the form link during
                              the submission period.
                              <a
                                :href="githubLinkScheduleAndReminderFeature"
                                class="preview_info_link_field_white"
                                :target="'_blank'"
                              >
                                Learn more
                                <font-awesome-icon
                                  icon="fa-solid fa-square-arrow-up-right"
                              /></a>
                            </span>
                          </v-tooltip>
                        </template>
                      </v-checkbox>
                    </v-col>
                  </v-row>
                </v-expand-transition>
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
import {
  IdentityMode,
  IdentityProviders,
  Regex,
  ScheduleType,
} from '@/utils/constants';
import {
  getAvailableDates,
  calculateCloseDate,
  isDateValidForMailNotification,
} from '@/utils/transformUtils';
import moment from 'moment';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faFlask,
  faXmark,
  faSquareArrowUpRight,
} from '@fortawesome/free-solid-svg-icons';
library.add(faFlask, faXmark, faSquareArrowUpRight);

export default {
  name: 'FormSettings',
  props: {
    formId: String,
  },
  data() {
    // debugger;
    return {
      githubLinkBulkUpload:
        'https://github.com/bcgov/common-hosted-form-service/wiki/Allow-multiple-draft-upload',
      githubLinkCopyFromExistingFeature:
        'https://github.com/bcgov/common-hosted-form-service/wiki/Copy-an-existing-submission',
      githubLinkScheduleAndReminderFeature:
        'https://github.com/bcgov/common-hosted-form-service/wiki/Schedule-and-Reminder-notification',
      repeatUntil: false,
      closeSubmissionDateDraw: false,
      openSubmissionDateDraw: false,
      enableReminderDraw: true,
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
        (v) => !!v || 'This field is required.',
        (v) =>
          (v &&
            new RegExp(
              /^(19|20)\d\d[- /.](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g
            ).test(v)) ||
          'Date must be in correct format. ie. yyyy-mm-dd',
      ],
      scheduleCloseDate: [
        (v) => !!v || 'This field is required.',
        (v) =>
          (v &&
            new RegExp(
              /^(19|20)\d\d[- /.](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g
            ).test(v)) ||
          'Date must be in correct format. ie. yyyy-mm-dd',
        (v) =>
          moment(v).isAfter(this.schedule.openSubmissionDateTime, 'day') ||
          'Close Submission date should be greater then open submission date.',
      ],
      roundNumber: [
        (v) => !!v || 'This field is required.',
        (v) =>
          (v && new RegExp(/^[1-9]\d{0,5}(?:\.\d{1,2})?$/g).test(v)) ||
          'Value must be a number. ie. 1,2,3,5,99',
      ],
      repeatTerm: [
        (v) => !!v || 'This field is required.',
        (v) =>
          (v && new RegExp(/^[1-9]\d{0,5}(?:\.\d{1,2})?$/g).test(v)) ||
          'Value must be an number. ie. 1,2,3,5,99',
      ],
      scheduleTypedRules: [(v) => !!v || 'Please select atleast 1 option'],
      allowLateSubmissionRule: [
        // (v) => !!v || 'This field is required'
      ],
      intervalType: [(v) => !!v || 'This field is required.'],
      repeatIntervalType: [
        (v) => !!v || 'This field is required.',
        (v) =>
          this.AVAILABLE_PERIOD_OPTIONS.includes(v) ||
          'This should be a valid interval.',
      ],
      repeatIntervalTypeReminder: [
        (v) => !!v || 'This field is required & should be an interval.',
        (v) =>
          this.AVAILABLE_PERIOD_INTERVAL.includes(v) ||
          'This field is required & should be a valid interval.',
      ],
      closeMessage: [(v) => !!v || 'This field is required.'],
      repeatUntilDate: [
        (v) => !!v || 'This field is required.',
        (v) =>
          (v &&
            new RegExp(
              /^(19|20)\d\d[- /.](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g
            ).test(v)) ||
          'Date must be in correct format. ie. yyyy-mm-dd',
        (v) =>
          moment(v).isAfter(this.schedule.openSubmissionDateTime, 'day') ||
          'Repeat untill date should be greater then open submission date.',
      ],
    };
  },
  computed: {
    ...mapFields('form', [
      'form.description',
      'form.enableSubmitterDraft',
      'form.enableCopyExistingSubmission',
      'form.enableStatusUpdates',
      'form.allowSubmitterToUploadFile',
      'form.id',
      'form.idps',
      'form.name',
      'form.sendSubRecieviedEmail',
      'form.showSubmissionConfirmation',
      'form.submissionReceivedEmails',
      'form.userType',
      'form.schedule',
      'form.reminder_enabled',
      'form.versions',
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
    AVAILABLE_DATES() {
      //return [];
      const getDates = getAvailableDates(
        this.schedule.keepOpenForTerm,
        this.schedule.keepOpenForInterval,
        this.schedule.openSubmissionDateTime,
        this.schedule.repeatSubmission.everyTerm,
        this.schedule.repeatSubmission.everyIntervalType,
        this.schedule.allowLateSubmissions.forNext.term,
        this.schedule.allowLateSubmissions.forNext.intervalType,
        this.schedule.repeatSubmission.repeatUntil,
        this.schedule.scheduleType,
        this.schedule.closeSubmissionDateTime
      );
      return getDates;
    },
    CALCULATE_CLOSE_DATE() {
      const closeDateCalculated = calculateCloseDate(
        this.schedule.closeSubmissionDateTime,
        this.schedule.allowLateSubmissions.forNext.term,
        this.schedule.allowLateSubmissions.forNext.intervalType
      );
      return closeDateCalculated;
    },
    AVAILABLE_PERIOD_OPTIONS() {
      let arrayOfOption = ['weeks', 'months', 'quarters', 'years'];
      let diffInDays = 0;
      if (
        this.schedule.openSubmissionDateTime &&
        this.schedule.keepOpenForInterval &&
        this.schedule.keepOpenForTerm
      ) {
        diffInDays = moment
          .duration({
            [this.schedule.keepOpenForInterval]: this.schedule.keepOpenForTerm,
          })
          .asDays(); // moment.duration(this.schedule.keepOpenForTerm, this.schedule.keepOpenForInterval).days();

        if (
          this.schedule.allowLateSubmissions.enabled &&
          this.schedule.allowLateSubmissions.forNext.term &&
          this.schedule.allowLateSubmissions.forNext.intervalType
        ) {
          let durationoflatesubInDays = 0;
          if (
            this.schedule.allowLateSubmissions.forNext.intervalType === 'days'
          ) {
            durationoflatesubInDays =
              this.schedule.allowLateSubmissions.forNext.term;
          } else {
            durationoflatesubInDays = moment
              .duration({
                [this.schedule.allowLateSubmissions.forNext.intervalType]:
                  this.schedule.allowLateSubmissions.forNext.term,
              })
              .asDays();
          }

          diffInDays = Number(diffInDays) + Number(durationoflatesubInDays);
        }
      }

      switch (true) {
        case diffInDays > 7 && diffInDays <= 30:
          arrayOfOption = ['months', 'quarters', 'years'];
          break;

        case diffInDays > 30 && diffInDays <= 91:
          arrayOfOption = ['quarters', 'years'];
          break;

        case diffInDays > 91:
          arrayOfOption = ['years'];
          break;

        default:
          arrayOfOption = ['weeks', 'months', 'quarters', 'years'];
          break;
      }
      return arrayOfOption;
    },
    INTERVAL_OPEN() {
      return moment
        .duration({
          [this.schedule.keepOpenForInterval]: this.schedule.keepOpenForTerm,
        })
        .asDays();
    },
    AVAILABLE_PERIOD_INTERVAL() {
      let arrayOfOption = [
        'Daily',
        'Weekly',
        'Bi-weekly',
        'Monthly',
        'Quarterly',
        'Semi-Annually',
        'Annually',
      ];
      let diffInDays = this.INTERVAL_OPEN;
      switch (true) {
        case diffInDays <= 7:
          arrayOfOption = ['Daily'];
          break;
        case diffInDays > 7 && diffInDays <= 14:
          arrayOfOption = ['Daily', 'Weekly'];
          break;
        case diffInDays > 14 && diffInDays <= 31:
          arrayOfOption = ['Daily', 'Weekly', 'Bi-weekly'];
          break;
        case diffInDays > 31 && diffInDays <= 91:
          arrayOfOption = ['Daily', 'Weekly', 'Bi-weekly', 'Monthly'];
          break;
        case diffInDays > 91 && diffInDays <= 183:
          arrayOfOption = [
            'Daily',
            'Weekly',
            'Bi-weekly',
            'Monthly',
            'Quarterly',
          ];
          break;
        case diffInDays > 183 && diffInDays <= 365:
          arrayOfOption = [
            'Daily',
            'Weekly',
            'Bi-weekly',
            'Monthly',
            'Quarterly',
            'Semi-Annually',
          ];
          break;
        default:
          arrayOfOption = [
            'Daily',
            'Weekly',
            'Bi-weekly',
            'Monthly',
            'Quarterly',
            'Semi-Annually',
            'Annually',
          ];
          break;
      }
      return arrayOfOption;
    },
    SCHEDULE_TYPE() {
      return ScheduleType;
    },
  },
  watch: {},
  methods: {
    ...mapActions('form', ['fetchForm']),
    userTypeChanged() {
      // if they checked enable drafts then went back to public, uncheck it
      if (this.userType === this.ID_MODE.PUBLIC) {
        this.enableSubmitterDraft = false;
        this.allowSubmitterToUploadFile = false;
        this.enableCopyExistingSubmission = false;
      }
      if (this.userType !== 'team') {
        this.reminder_enabled = false;
      }
    },
    openDateTypeChanged() {
      if (
        isDateValidForMailNotification(this.schedule.openSubmissionDateTime)
      ) {
        this.enableReminderDraw = false;
        this.reminder_enabled = false;
      } else {
        this.enableReminderDraw = true;
      }
    },
    repeatSubmissionChanged() {
      if (!this.schedule.repeatSubmission.enabled) {
        this.schedule.repeatSubmission.everyTerm = null;
        this.schedule.repeatSubmission.everyIntervalType = null;
        this.schedule.repeatSubmission.repeatUntil = null;
      }
    },
    scheduleTypeChanged() {
      if (this.schedule.scheduleType === ScheduleType.MANUAL) {
        this.schedule.keepOpenForTerm = null;
        this.schedule.keepOpenForInterval = null;
        this.schedule.closingMessageEnabled = null;
        this.schedule.closingMessage = null;
        this.schedule.closeSubmissionDateTime = null;
        (this.schedule.repeatSubmission = {
          enabled: null,
          repeatUntil: null,
          everyTerm: null,
          everyIntervalType: null,
        }),
          (this.schedule.allowLateSubmissions = {
            enabled: null,
            forNext: {
              term: null,
              intervalType: null,
            },
          });
      }
      if (this.schedule.scheduleType === ScheduleType.CLOSINGDATE) {
        this.schedule.keepOpenForTerm = null;
        this.schedule.keepOpenForInterval = null;
        this.schedule.closingMessageEnabled = null;
        this.schedule.closingMessage = null;
        (this.schedule.repeatSubmission = {
          enabled: null,
          repeatUntil: null,
          everyTerm: null,
          everyIntervalType: null,
        }),
          (this.schedule.allowLateSubmissions = {
            enabled: null,
            forNext: {
              term: null,
              intervalType: null,
            },
          });
      }
      if (this.schedule.scheduleType === ScheduleType.PERIOD) {
        this.schedule.closeSubmissionDateTime = null;
        this.schedule.closingMessageEnabled = null;
        this.schedule.closingMessage = null;
        this.schedule.allowLateSubmissions = {
          enabled: null,
          forNext: {
            term: null,
            intervalType: null,
          },
        };
      }
    },
    enableSubmitterDraftChanged() {
      if (!this.enableSubmitterDraft) {
        this.allowSubmitterToUploadFile = false;
      }
    },
    allowSubmitterToUploadFileChanged() {
      if (this.allowSubmitterToUploadFile && !this.enableSubmitterDraft) {
        this.enableSubmitterDraft = true;
      }
    },
  },
};
</script>
