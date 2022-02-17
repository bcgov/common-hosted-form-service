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
                  <!-- Commented out as per IDIM request -->
                  <!-- <v-radio
                    class="mx-2"
                    disabled
                    label="Business BCeID"
                    :value="ID_PROVIDERS.BCEIDBUSINESS"
                  /> -->
                  <!-- Mandatory BCeID process notification -->
                  <v-expand-transition>
                    <BaseInfoCard
                      v-if="idps[0] && idps[0] === ID_PROVIDERS.BCEIDBASIC"
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
    </v-row>
  </v-container>
</template>

<script>
import { mapActions } from 'vuex';
import { mapFields } from 'vuex-map-fields';
import { IdentityMode, IdentityProviders, Regex } from '@/utils/constants';

export default {
  name: 'FormSettings',
  props: {
    formId: String,
  },
  data() {
    return {
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
    ]),
    ID_MODE() {
      return IdentityMode;
    },
    ID_PROVIDERS() {
      return IdentityProviders;
    },
  },
  methods: {
    ...mapActions('form', ['fetchForm']),
    userTypeChanged() {
      // if they checked enable drafts then went back to public, uncheck it
      if (this.userType === this.ID_MODE.PUBLIC) {
        this.enableSubmitterDraft = false;
      }
    },
  },
};
</script>
