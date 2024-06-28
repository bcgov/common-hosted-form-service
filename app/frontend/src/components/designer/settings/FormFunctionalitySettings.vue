<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useIdpStore } from '~/store/identityProviders';
import { IdentityMode } from '~/utils/constants';

const { locale } = useI18n({ useScope: 'global' });

const githubLinkBulkUpload = ref(
  'https://github.com/bcgov/common-hosted-form-service/wiki/Allow-multiple-draft-upload'
);
const githubLinkCopyFromExistingFeature = ref(
  'https://github.com/bcgov/common-hosted-form-service/wiki/Copy-an-existing-submission'
);
const githubLinkScheduleAndReminderFeature = ref(
  'https://github.com/bcgov/common-hosted-form-service/wiki/Schedule-and-Reminder-notification'
);
const githubLinkEventSubscriptionFeature = ref(
  'https://github.com/bcgov/common-hosted-form-service/wiki/Event-Subscription'
);
const githubLinkWideFormLayout = ref(
  'https://github.com/bcgov/common-hosted-form-service/wiki/Wide-Form-Layout'
);

const authStore = useAuthStore();
const formStore = useFormStore();
const idpStore = useIdpStore();

const { identityProvider } = storeToRefs(authStore);
const { form, isRTL } = storeToRefs(formStore);

const ID_MODE = computed(() => IdentityMode);
const primaryIdpUser = computed(() =>
  idpStore.isPrimary(identityProvider?.value?.code)
);

function enableSubmitterDraftChanged() {
  if (!form.value.enableSubmitterDraft) {
    form.value.allowSubmitterToUploadFile = false;
  }
}

function allowSubmitterToUploadFileChanged() {
  if (
    form.value.allowSubmitterToUploadFile &&
    !form.value.enableSubmitterDraft
  ) {
    form.value.enableSubmitterDraft = true;
  }
}

defineExpose({
  enableSubmitterDraftChanged,
  allowSubmitterToUploadFileChanged,
});
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="locale">{{
        $t('trans.formSettings.formFunctionality')
      }}</span></template
    >
    <v-checkbox
      v-model="form.enableSubmitterDraft"
      data-test="canSaveAndEditDraftsCheckbox"
      hide-details="auto"
      class="my-0"
      :disabled="form.userType === ID_MODE.PUBLIC"
      @update:model-value="enableSubmitterDraftChanged"
    >
      <template #label>
        <span
          :class="{ 'mr-2': isRTL }"
          :lang="locale"
          v-html="$t('trans.formSettings.canSaveAndEditDraftLabel')"
        ></span>
      </template>
    </v-checkbox>

    <v-checkbox
      v-model="form.enableStatusUpdates"
      data-test="canUpdateStatusOfFormCheckbox"
      hide-details="auto"
      class="my-0"
    >
      <template #label>
        <span
          :class="{ 'mr-2': isRTL }"
          :lang="locale"
          v-html="$t('trans.formSettings.canUpdateStatusAsReviewer')"
        ></span>
      </template>
    </v-checkbox>

    <v-checkbox
      v-model="form.allowSubmitterToUploadFile"
      data-test="canUploadDraftCheckbox"
      hide-details="auto"
      class="my-0"
      :disabled="form.userType === ID_MODE.PUBLIC"
      @update:model-value="allowSubmitterToUploadFileChanged"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span
            :lang="locale"
            v-html="$t('trans.formSettings.allowMultiDraft')"
          />
          <v-tooltip location="bottom" close-delay="2500">
            <template #activator="{ props }">
              <v-icon
                color="primary"
                class="ml-3"
                :class="{ 'mr-2': isRTL }"
                v-bind="props"
                icon="mdi:mdi-flask"
              />
            </template>
            <span :lang="locale"
              >{{ $t('trans.formSettings.experimental') }}
              <a
                :href="githubLinkBulkUpload"
                class="preview_info_link_field_white"
                :target="'_blank'"
                :lang="locale"
              >
                {{ $t('trans.formSettings.learnMore') }}
                <v-icon
                  icon="mdi:mdi-arrow-top-right-bold-box-outline"
                ></v-icon></a
            ></span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <v-checkbox
      v-if="!formStore.isFormPublished"
      v-model="form.schedule.enabled"
      disabled
      hide-details="auto"
      data-test="canScheduleFormSubmissionCheckbox"
      class="my-0"
    >
      <template #label>
        <span :class="{ 'mr-2': isRTL }" :lang="locale"
          >{{ $t('trans.formSettings.formSubmissinScheduleMsg') }}
        </span>
      </template>
    </v-checkbox>

    <v-checkbox
      v-if="formStore.isFormPublished"
      v-model="form.schedule.enabled"
      hide-details="auto"
      data-test="canScheduleFormSubmissionCheckbox"
      class="my-0"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span :lang="locale">{{
            $t('trans.formSettings.formSubmissionsSchedule')
          }}</span>
          <v-tooltip location="bottom" close-delay="2500">
            <template #activator="{ props }">
              <v-icon
                color="primary"
                class="ml-3"
                :class="{ 'mr-2': isRTL }"
                v-bind="props"
                icon="mdi:mdi-flask"
              ></v-icon>
            </template>
            <span :lang="locale"
              >{{ $t('trans.formSettings.experimental') }}
              <a
                :href="githubLinkScheduleAndReminderFeature"
                class="preview_info_link_field_white"
                :target="'_blank'"
                :lang="locale"
              >
                {{ $t('trans.formSettings.learnMore') }}
                <v-icon
                  icon="mdi:mdi-arrow-top-right-bold-box-outline"
                ></v-icon></a
            ></span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <v-checkbox
      v-model="form.enableCopyExistingSubmission"
      hide-details="auto"
      data-test="canCopyExistingSubmissionCheckbox"
      class="my-0"
      :disabled="form.userType === ID_MODE.PUBLIC"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span
            style="max-width: 80%"
            :lang="locale"
            v-html="$t('trans.formSettings.submitterCanCopyExistingSubmissn')"
          />
          <v-tooltip location="bottom" close-delay="2500">
            <template #activator="{ props }">
              <v-icon
                color="primary"
                class="ml-3"
                :class="{ 'mr-2': isRTL }"
                v-bind="props"
                icon="mdi:mdi-flask"
              ></v-icon>
            </template>
            <span :lang="locale"
              >{{ $t('trans.formSettings.experimental') }}
              <a
                :href="githubLinkCopyFromExistingFeature"
                class="preview_info_link_field_white"
                :target="'_blank'"
                :lang="locale"
              >
                {{ $t('trans.formSettings.learnMore') }}
                <v-icon
                  icon="mdi:mdi-arrow-top-right-bold-box-outline"
                ></v-icon></a
            ></span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>
    <v-checkbox
      v-model="form.subscribe.enabled"
      hide-details="auto"
      data-test="canAllowEventSubscriptionCheckbox"
      class="my-0"
      :disabled="primaryIdpUser === false || !formStore.isFormPublished"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span
            style="max-width: 80%"
            :lang="locale"
            v-html="$t('trans.formSettings.allowEventSubscription')"
          />
          <v-tooltip location="bottom" close-delay="2500">
            <template #activator="{ props }">
              <v-icon
                color="primary"
                class="ml-3"
                :class="{ 'mr-2': isRTL }"
                v-bind="props"
                icon="mdi:mdi-flask"
              ></v-icon>
            </template>
            <span :lang="locale"
              >{{ $t('trans.formSettings.experimental') }}
              <a
                :href="githubLinkEventSubscriptionFeature"
                class="preview_info_link_field_white"
                :target="'_blank'"
                :lang="locale"
              >
                {{ $t('trans.formSettings.learnMore') }}
                <v-icon
                  icon="mdi:mdi-arrow-top-right-bold-box-outline"
                ></v-icon></a
            ></span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>
    <v-checkbox
      v-model="form.wideFormLayout"
      hide-details="auto"
      data-test="canAllowWideFormLayoutCheckbox"
      class="my-0"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span
            style="max-width: 80%"
            :lang="locale"
            v-html="$t('trans.formSettings.wideFormLayout')"
          />
          <v-tooltip location="bottom" close-delay="2500">
            <template #activator="{ props }">
              <v-icon
                color="primary"
                class="ml-3"
                :class="{ 'mr-2': isRTL }"
                v-bind="props"
                icon="mdi:mdi-flask"
              ></v-icon>
            </template>
            <span :lang="locale"
              >{{ $t('trans.formSettings.experimental') }}
              <a
                :href="githubLinkWideFormLayout"
                class="preview_info_link_field_white"
                :target="'_blank'"
                :lang="locale"
              >
                {{ $t('trans.formSettings.learnMore') }}
                <v-icon
                  icon="mdi:mdi-arrow-top-right-bold-box-outline"
                ></v-icon></a
            ></span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>
  </BasePanel>
</template>
