<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useIdpStore } from '~/store/identityProviders';
import { IdentityMode } from '~/utils/constants';

const props = defineProps({
  disabled: { type: Boolean, default: false },
});

const { locale } = useI18n({ useScope: 'global' });

const githubLinkBulkUpload = ref('https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/Allow-multiple-draft-upload/');
const githubLinkCopyFromExistingFeature = ref('https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/Copy-an-existing-submission/');
const githubLinkScheduleAndReminderFeature = ref('https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/Schedule-and-Reminder-notification/');
const githubLinkEventSubscriptionFeature = ref('https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Integrations/Event-Subscription/');
const githubLinkWideFormLayout = ref('https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/Wide-Form-Layout');

const authStore = useAuthStore();
const formStore = useFormStore();
const idpStore = useIdpStore();

const { identityProvider } = storeToRefs(authStore);
const { form, isRTL } = storeToRefs(formStore);

const ID_MODE = computed(() => IdentityMode);
const primaryIdpUser = computed(() => idpStore.isPrimary(identityProvider?.value?.code));

// Unified computed disabled states
const isPublicDisabled = computed(() => props.disabled || form.value.userType === ID_MODE.value.PUBLIC);
const isGeneralDisabled = computed(() => props.disabled);
const isDraftShareDisabled = computed(() => props.disabled || !form.value.enableSubmitterDraft);
const isFormScheduleDisabled = computed(() => props.disabled || !formStore.isFormPublished);
const isEventSubscriptionDisabled = computed(() => props.disabled || primaryIdpUser.value === false || !formStore.isFormPublished);

function enableSubmitterDraftChanged() {
  if (!form.value.enableSubmitterDraft) form.value.allowSubmitterToUploadFile = false;
}

function allowSubmitterToUploadFileChanged() {
  if (form.value.allowSubmitterToUploadFile && !form.value.enableSubmitterDraft)
    form.value.enableSubmitterDraft = true;
}

defineExpose({ enableSubmitterDraftChanged, allowSubmitterToUploadFileChanged });
</script>

<template>
  <BasePanel class="fill-height">
    <template #title>
      <span :lang="locale">{{ $t('trans.formSettings.formFunctionality') }}</span>
    </template>

    <v-checkbox v-model="form.enableSubmitterDraft" :disabled="isPublicDisabled" hide-details="auto" class="my-0" data-test="canSaveAndEditDraftsCheckbox" @update:model-value="enableSubmitterDraftChanged">
      <template #label>
        <span :class="{ 'mr-2': isRTL }" :lang="locale" v-html="$t('trans.formSettings.canSaveAndEditDraftLabel')"></span>
      </template>
    </v-checkbox>

    <v-checkbox v-model="form.enableStatusUpdates" :disabled="isGeneralDisabled" hide-details="auto" class="my-0" data-test="canUpdateStatusOfFormCheckbox">
      <template #label>
        <span :class="{ 'mr-2': isRTL }" :lang="locale" v-html="$t('trans.formSettings.canUpdateStatusAsReviewer')"></span>
      </template>
    </v-checkbox>

    <v-checkbox v-model="form.enableSubmitterRevision" :disabled="isPublicDisabled" hide-details="auto" class="my-0" data-test="canSubmitterRevisionFormCheckbox">
      <template #label>
        <span :class="{ 'mr-2': isRTL }" :lang="locale" v-html="$t('trans.formSettings.enableSubmitterRevision')"></span>
      </template>
    </v-checkbox>

    <v-checkbox v-if="form.enableStatusUpdates || form.enableSubmitterRevision"
                v-model="form.showAssigneeInSubmissionsTable"
                :disabled="isGeneralDisabled"
                hide-details="auto"
                class="my-0 ml-6"
                data-test="showAssigneeInSubmissionsTableCheckbox">
      <template #label>
        <span :class="{ 'mr-2': isRTL }" :lang="locale" v-html="$t('trans.formSettings.displayAssigneeColumn')"></span>
      </template>
    </v-checkbox>

    <v-checkbox v-model="form.allowSubmitterToUploadFile" :disabled="isPublicDisabled" hide-details="auto" class="my-0" data-test="canUploadDraftCheckbox" @update:model-value="allowSubmitterToUploadFileChanged">
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span :lang="locale" v-html="$t('trans.formSettings.allowMultiDraft')" />
          <v-tooltip location="bottom" close-delay="2500">
            <template #activator="{ props }">
              <v-icon color="primary" class="ml-3" :class="{ 'mr-2': isRTL }" v-bind="props" icon="mdi:mdi-flask"/>
            </template>
            <span :lang="locale">
              {{ $t('trans.formSettings.experimental') }}
              <a :href="githubLinkBulkUpload" class="preview_info_link_field_white" target="_blank" :lang="locale">
                {{ $t('trans.formSettings.learnMore') }}
                <v-icon icon="mdi:mdi-arrow-top-right-bold-box-outline"></v-icon>
              </a>
            </span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <v-checkbox v-model="form.schedule.enabled" :disabled="isFormScheduleDisabled" hide-details="auto" class="my-0" data-test="canScheduleFormSubmissionCheckbox">
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span :lang="locale">{{ formStore.isFormPublished ? $t('trans.formSettings.formSubmissionsSchedule') : $t('trans.formSettings.formSubmissinScheduleMsg') }}</span>
          <v-tooltip v-if="formStore.isFormPublished" location="bottom" close-delay="2500">
            <template #activator="{ props }">
              <v-icon color="primary" class="ml-3" :class="{ 'mr-2': isRTL }" v-bind="props" icon="mdi:mdi-flask"/>
            </template>
            <span :lang="locale">
              {{ $t('trans.formSettings.experimental') }}
              <a :href="githubLinkScheduleAndReminderFeature" class="preview_info_link_field_white" target="_blank" :lang="locale">
                {{ $t('trans.formSettings.learnMore') }}
                <v-icon icon="mdi:mdi-arrow-top-right-bold-box-outline"></v-icon>
              </a>
            </span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <v-checkbox v-model="form.enableCopyExistingSubmission" :disabled="isPublicDisabled" hide-details="auto" class="my-0" data-test="canCopyExistingSubmissionCheckbox">
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span :lang="locale" style="max-width: 80%" v-html="$t('trans.formSettings.submitterCanCopyExistingSubmissn')"></span>
          <v-tooltip location="bottom" close-delay="2500">
            <template #activator="{ props }">
              <v-icon color="primary" class="ml-3" :class="{ 'mr-2': isRTL }" v-bind="props" icon="mdi:mdi-flask"/>
            </template>
            <span :lang="locale">
              {{ $t('trans.formSettings.experimental') }}
              <a :href="githubLinkCopyFromExistingFeature" class="preview_info_link_field_white" target="_blank" :lang="locale">
                {{ $t('trans.formSettings.learnMore') }}
                <v-icon icon="mdi:mdi-arrow-top-right-bold-box-outline"></v-icon>
              </a>
            </span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <v-checkbox v-model="form.subscribe.enabled" :disabled="isEventSubscriptionDisabled" hide-details="auto" class="my-0" data-test="canAllowEventSubscriptionCheckbox">
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span :lang="locale" style="max-width: 80%" v-html="$t('trans.formSettings.allowEventSubscription')"></span>
          <v-tooltip location="bottom" close-delay="2500">
            <template #activator="{ props }">
              <v-icon color="primary" class="ml-3" :class="{ 'mr-2': isRTL }" v-bind="props" icon="mdi:mdi-flask"/>
            </template>
            <span :lang="locale">
              {{ $t('trans.formSettings.experimental') }}
              <a :href="githubLinkEventSubscriptionFeature" class="preview_info_link_field_white" target="_blank" :lang="locale">
                {{ $t('trans.formSettings.learnMore') }}
                <v-icon icon="mdi:mdi-arrow-top-right-bold-box-outline"></v-icon>
              </a>
            </span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <v-checkbox v-model="form.wideFormLayout" :disabled="isPublicDisabled" hide-details="auto" class="my-0" data-test="canAllowWideFormLayoutCheckbox">
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span :lang="locale" style="max-width: 80%" v-html="$t('trans.formSettings.wideFormLayout')"></span>
          <v-tooltip location="bottom" close-delay="2500">
            <template #activator="{ props }">
              <v-icon color="primary" class="ml-3" :class="{ 'mr-2': isRTL }" v-bind="props" icon="mdi:mdi-flask"/>
            </template>
            <span :lang="locale">
              {{ $t('trans.formSettings.experimental') }}
              <a :href="githubLinkWideFormLayout" class="preview_info_link_field_white" target="_blank" :lang="locale">
                {{ $t('trans.formSettings.learnMore') }}
                <v-icon icon="mdi:mdi-arrow-top-right-bold-box-outline"></v-icon>
              </a>
            </span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <v-checkbox v-model="form.enableTeamMemberDraftShare" :disabled="isDraftShareDisabled" hide-details="auto" class="my-0" data-test="enableTeamMemberDraftShare">
      <template #label>
        <span :class="{ 'mr-2': isRTL }" :lang="locale" v-html="$t('trans.canShareDraft.shareDraftMessage')"></span>
      </template>
    </v-checkbox>
  </BasePanel>
</template>