<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useIdpStore } from '~/store/identityProviders';
import { useTenantStore } from '~/store/tenant';
import { IdentityMode } from '~/utils/constants';

const props = defineProps({
  disabled: { type: Boolean, default: false },
});

const { locale } = useI18n({ useScope: 'global' });

const githubLinkBulkUpload = ref(
  'https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/Allow-multiple-draft-upload/'
);
const githubLinkCopyFromExistingFeature = ref(
  'https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/Copy-an-existing-submission/'
);
const githubLinkScheduleAndReminderFeature = ref(
  'https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/Schedule-and-Reminder-notification/'
);
const githubLinkEventSubscriptionFeature = ref(
  'https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Integrations/Event-Subscription/'
);
const githubLinkWideFormLayout = ref(
  'https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/Wide-Form-Layout'
);

const authStore = useAuthStore();
const formStore = useFormStore();
const idpStore = useIdpStore();
const tenantStore = useTenantStore();

const { identityProvider } = storeToRefs(authStore);
const { form, isRTL } = storeToRefs(formStore);
const { selectedTenant } = storeToRefs(tenantStore);

const primaryIdpUser = computed(() =>
  idpStore.isPrimary(identityProvider?.value?.code)
);

//Centralized disabled states
const disabledStates = computed(() => {
  const base = props.disabled;
  return {
    public: base || form.value.userType === IdentityMode.PUBLIC,
    general: base,
    draftShare: base || !form.value.enableSubmitterDraft,
    schedule: base || !formStore.isFormPublished,
    eventSubscription:
      base || primaryIdpUser.value === false || !formStore.isFormPublished,
  };
});

// Dependency handlers
function enableSubmitterDraftChanged() {
  if (!form.value.enableSubmitterDraft) {
    form.value.allowSubmitterToUploadFile = false;
    form.value.enableTeamMemberDraftShare = false;
  }
}

function allowSubmitterToUploadFileChanged() {
  if (form.value.allowSubmitterToUploadFile && !form.value.enableSubmitterDraft)
    form.value.enableSubmitterDraft = true;
}

defineExpose({
  enableSubmitterDraftChanged,
  allowSubmitterToUploadFileChanged,
});
</script>

<template>
  <BasePanel class="fill-height">
    <template #title>
      <span :lang="locale">{{
        $t('trans.formSettings.formFunctionality')
      }}</span>
    </template>

    <!-- Save Drafts -->
    <v-checkbox
      v-model="form.enableSubmitterDraft"
      :disabled="disabledStates.public"
      hide-details="auto"
      class="my-0"
      data-test="canSaveAndEditDraftsCheckbox"
      @update:model-value="enableSubmitterDraftChanged"
    >
      <template #label>
        <span
          :class="{ 'mr-2': isRTL }"
          :lang="locale"
          v-html="$t('trans.formSettings.canSaveAndEditDraftLabel')"
        />
      </template>
    </v-checkbox>

    <!-- Status Updates -->
    <v-checkbox
      v-model="form.enableStatusUpdates"
      :disabled="disabledStates.general"
      hide-details="auto"
      class="my-0"
      data-test="canUpdateStatusOfFormCheckbox"
    >
      <template #label>
        <span
          :class="{ 'mr-2': isRTL }"
          :lang="locale"
          v-html="$t('trans.formSettings.canUpdateStatusAsReviewer')"
        />
      </template>
    </v-checkbox>

    <!-- Submitter Revision -->
    <v-checkbox
      v-model="form.enableSubmitterRevision"
      :disabled="disabledStates.public"
      hide-details="auto"
      class="my-0"
      data-test="canSubmitterRevisionFormCheckbox"
    >
      <template #label>
        <span
          :class="{ 'mr-2': isRTL }"
          :lang="locale"
          v-html="$t('trans.formSettings.enableSubmitterRevision')"
        />
      </template>
    </v-checkbox>

    <!-- Show Assignee -->
    <v-checkbox
      v-if="form.enableStatusUpdates || form.enableSubmitterRevision"
      v-model="form.showAssigneeInSubmissionsTable"
      :disabled="disabledStates.general"
      hide-details="auto"
      class="my-0 ml-6"
      data-test="showAssigneeInSubmissionsTableCheckbox"
    >
      <template #label>
        <span
          :class="{ 'mr-2': isRTL }"
          :lang="locale"
          v-html="$t('trans.formSettings.displayAssigneeColumn')"
        />
      </template>
    </v-checkbox>

    <!-- Upload Draft Files -->
    <v-checkbox
      v-model="form.allowSubmitterToUploadFile"
      :disabled="disabledStates.public"
      hide-details="auto"
      class="my-0"
      data-test="canUploadDraftCheckbox"
      @update:model-value="allowSubmitterToUploadFileChanged"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span
            :lang="locale"
            v-html="$t('trans.formSettings.allowMultiDraft')"
          />
          <v-tooltip location="bottom" close-delay="2500">
            <template #activator="slotProps">
              <v-icon
                color="primary"
                class="ml-3"
                :class="{ 'mr-2': isRTL }"
                v-bind="slotProps.props"
                icon="mdi:mdi-flask"
              />
            </template>
            <span :lang="locale">
              {{ $t('trans.formSettings.experimental') }}
              <a
                :href="githubLinkBulkUpload"
                class="preview_info_link_field_white"
                target="_blank"
                rel="noopener noreferrer"
                :lang="locale"
              >
                {{ $t('trans.formSettings.learnMore') }}
                <v-icon icon="mdi:mdi-arrow-top-right-bold-box-outline" />
              </a>
            </span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <!-- Schedule -->
    <v-checkbox
      v-model="form.schedule.enabled"
      :disabled="disabledStates.schedule"
      hide-details="auto"
      class="my-0"
      data-test="canScheduleFormSubmissionCheckbox"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span :lang="locale">
            {{
              formStore.isFormPublished
                ? $t('trans.formSettings.formSubmissionsSchedule')
                : $t('trans.formSettings.formSubmissinScheduleMsg')
            }}
          </span>
          <v-tooltip
            v-if="formStore.isFormPublished"
            location="bottom"
            close-delay="2500"
          >
            <template #activator="slotProps">
              <v-icon
                color="primary"
                class="ml-3"
                :class="{ 'mr-2': isRTL }"
                v-bind="slotProps.props"
                icon="mdi:mdi-flask"
              />
            </template>
            <span :lang="locale">
              {{ $t('trans.formSettings.experimental') }}
              <a
                :href="githubLinkScheduleAndReminderFeature"
                class="preview_info_link_field_white"
                target="_blank"
                rel="noopener noreferrer"
                :lang="locale"
              >
                {{ $t('trans.formSettings.learnMore') }}
                <v-icon icon="mdi:mdi-arrow-top-right-bold-box-outline" />
              </a>
            </span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <!-- Copy Existing Submission -->
    <v-checkbox
      v-model="form.enableCopyExistingSubmission"
      :disabled="disabledStates.public"
      hide-details="auto"
      class="my-0"
      data-test="canCopyExistingSubmissionCheckbox"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span
            :lang="locale"
            style="max-width: 80%"
            v-html="$t('trans.formSettings.submitterCanCopyExistingSubmissn')"
          />
          <v-tooltip location="bottom" close-delay="2500">
            <template #activator="slotProps">
              <v-icon
                color="primary"
                class="ml-3"
                :class="{ 'mr-2': isRTL }"
                v-bind="slotProps.props"
                icon="mdi:mdi-flask"
              />
            </template>
            <span :lang="locale">
              {{ $t('trans.formSettings.experimental') }}
              <a
                :href="githubLinkCopyFromExistingFeature"
                class="preview_info_link_field_white"
                target="_blank"
                rel="noopener noreferrer"
                :lang="locale"
              >
                {{ $t('trans.formSettings.learnMore') }}
                <v-icon icon="mdi:mdi-arrow-top-right-bold-box-outline" />
              </a>
            </span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <!-- Event Subscription -->
    <v-checkbox
      v-model="form.subscribe.enabled"
      :disabled="disabledStates.eventSubscription"
      hide-details="auto"
      class="my-0"
      data-test="canAllowEventSubscriptionCheckbox"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span
            :lang="locale"
            style="max-width: 80%"
            v-html="$t('trans.formSettings.allowEventSubscription')"
          />
          <v-tooltip location="bottom" close-delay="2500">
            <template #activator="slotProps">
              <v-icon
                color="primary"
                class="ml-3"
                :class="{ 'mr-2': isRTL }"
                v-bind="slotProps.props"
                icon="mdi:mdi-flask"
              />
            </template>
            <span :lang="locale">
              {{ $t('trans.formSettings.experimental') }}
              <a
                :href="githubLinkEventSubscriptionFeature"
                class="preview_info_link_field_white"
                target="_blank"
                rel="noopener noreferrer"
                :lang="locale"
              >
                {{ $t('trans.formSettings.learnMore') }}
                <v-icon icon="mdi:mdi-arrow-top-right-bold-box-outline" />
              </a>
            </span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <!-- Wide Form Layout -->
    <v-checkbox
      v-model="form.wideFormLayout"
      :disabled="disabledStates.general"
      hide-details="auto"
      class="my-0"
      data-test="canAllowWideFormLayoutCheckbox"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span
            :lang="locale"
            style="max-width: 80%"
            v-html="$t('trans.formSettings.wideFormLayout')"
          />
          <v-tooltip location="bottom" close-delay="2500">
            <template #activator="slotProps">
              <v-icon
                color="primary"
                class="ml-3"
                :class="{ 'mr-2': isRTL }"
                v-bind="slotProps.props"
                icon="mdi:mdi-flask"
              />
            </template>
            <span :lang="locale">
              {{ $t('trans.formSettings.experimental') }}
              <a
                :href="githubLinkWideFormLayout"
                class="preview_info_link_field_white"
                target="_blank"
                rel="noopener noreferrer"
                :lang="locale"
              >
                {{ $t('trans.formSettings.learnMore') }}
                <v-icon icon="mdi:mdi-arrow-top-right-bold-box-outline" />
              </a>
            </span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <!-- Share Draft - Hide for tenanted forms -->
    <v-checkbox
      v-if="!selectedTenant"
      v-model="form.enableTeamMemberDraftShare"
      :disabled="disabledStates.draftShare"
      hide-details="auto"
      class="my-0"
      data-test="enableTeamMemberDraftShare"
      @update:model-value="enableSubmitterDraftChanged"
    >
      <template #label>
        <span
          :class="{ 'mr-2': isRTL }"
          :lang="locale"
          v-html="$t('trans.canShareDraft.shareDraftMessage')"
        />
      </template>
    </v-checkbox>
  </BasePanel>
</template>
