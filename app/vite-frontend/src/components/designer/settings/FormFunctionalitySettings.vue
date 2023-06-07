<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';
import { IdentityMode } from '~/utils/constants';

const formStore = useFormStore();

const { form } = storeToRefs(formStore);

const githubLinkBulkUpload = ref(
  'https://github.com/bcgov/common-hosted-form-service/wiki/Allow-multiple-draft-upload'
);
const githubLinkCopyFromExistingFeature = ref(
  'https://github.com/bcgov/common-hosted-form-service/wiki/Copy-an-existing-submission'
);
const githubLinkScheduleAndReminderFeature = ref(
  'https://github.com/bcgov/common-hosted-form-service/wiki/Schedule-and-Reminder-notification'
);

const ID_MODE = computed(() => IdentityMode);
</script>

<template>
  <BasePanel class="fill-height">
    <template #title>{{ $t('trans.formSettings.formFunctionality') }}</template>
    <v-checkbox
      v-model="form.enableSubmitterDraft"
      class="my-0"
      :disabled="form.userType === ID_MODE.PUBLIC"
    >
      <template #label>
        <span v-html="$t('trans.formSettings.canSaveAndEditDraftLabel')"></span>
      </template>
    </v-checkbox>

    <v-checkbox v-model="form.enableStatusUpdates" class="my-0">
      <template #label>
        <span
          v-html="$t('trans.formSettings.canUpdateStatusAsReviewer')"
        ></span>
      </template>
    </v-checkbox>

    <v-checkbox
      v-model="form.allowSubmitterToUploadFile"
      class="my-0"
      :disabled="userType === ID_MODE.PUBLIC"
      @update:modelValue="allowSubmitterToUploadFileChanged"
    >
      <template #label>
        Allow <strong> multiple draft</strong> upload
        <v-tooltip location="bottom" close-delay="2500">
          <template #activator="{ props }">
            <v-icon
              color="primary"
              class="ml-3"
              v-bind="props"
              icon="mdi:mdi-flask"
            ></v-icon>
          </template>
          <span
            >{{ $t('trans.formSettings.experimental') }}
            <a
              :href="githubLinkBulkUpload"
              class="preview_info_link_field_white"
              :target="'_blank'"
            >
              {{ $t('trans.formSettings.learnMore') }}
              <v-icon
                icon="mdi:mdi-arrow-top-right-bold-box-outline"
              ></v-icon></a
          ></span>
        </v-tooltip>
      </template>
    </v-checkbox>

    <v-checkbox
      v-if="!formStore.isFormPublished"
      v-model="form.schedule.enabled"
      disabled
      class="my-0"
    >
      <template #label>
        {{ $t('trans.formSettings.formSubmissinScheduleMsg') }}
      </template>
    </v-checkbox>

    <v-checkbox
      v-if="formStore.isFormPublished"
      v-model="form.schedule.enabled"
      class="my-0"
    >
      <template #label>
        {{ $t('trans.formSettings.formSubmissionsSchedule') }}
        <v-tooltip location="bottom" close-delay="2500">
          <template #activator="{ props }">
            <v-icon
              color="primary"
              class="ml-3"
              v-bind="props"
              icon="mdi:mdi-flask"
            ></v-icon>
          </template>
          <span
            >{{ $t('trans.formSettings.experimental') }}
            <a
              :href="githubLinkScheduleAndReminderFeature"
              class="preview_info_link_field_white"
              :target="'_blank'"
            >
              {{ $t('trans.formSettings.learnMore') }}
              <v-icon
                icon="mdi:mdi-arrow-top-right-bold-box-outline"
              ></v-icon></a
          ></span>
        </v-tooltip>
      </template>
    </v-checkbox>

    <v-checkbox
      v-model="form.enableCopyExistingSubmission"
      class="my-0"
      :disabled="form.userType === ID_MODE.PUBLIC"
    >
      <template #label>
        <span
          style="max-width: 80%"
          v-html="$t('trans.formSettings.submitterCanCopyExistingSubmissn')"
        />
        <v-tooltip location="bottom" close-delay="2500">
          <template #activator="{ props }">
            <v-icon
              color="primary"
              class="ml-3"
              v-bind="props"
              icon="mdi:mdi-flask"
            ></v-icon>
          </template>
          <span
            >{{ $t('trans.formSettings.experimental') }}
            <a
              :href="githubLinkCopyFromExistingFeature"
              class="preview_info_link_field_white"
              :target="'_blank'"
            >
              {{ $t('trans.formSettings.learnMore') }}
              <v-icon
                icon="mdi:mdi-arrow-top-right-bold-box-outline"
              ></v-icon></a
          ></span>
        </v-tooltip>
      </template>
    </v-checkbox>
  </BasePanel>
</template>
