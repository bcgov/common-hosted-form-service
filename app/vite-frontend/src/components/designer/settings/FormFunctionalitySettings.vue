<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';
import { IdentityMode } from '~/utils/constants';

const formStore = useFormStore();

const { form } = storeToRefs(formStore);

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
    <template #title>Form Functionality</template>
    <v-checkbox
      v-model="form.enableSubmitterDraft"
      class="my-0"
      :disabled="form.userType === ID_MODE.PUBLIC"
    >
      <template #label>
        <span>
          Submitters can
          <strong>Save and Edit Drafts</strong>
        </span>
      </template>
    </v-checkbox>

    <v-checkbox v-model="form.enableStatusUpdates" class="my-0">
      <template #label>
        <span>
          Reviewers can <strong>Update the Status</strong> of this form (i.e.
          Submitted, Assigned, Completed)
        </span>
      </template>
    </v-checkbox>

    <v-checkbox
      v-if="!formStore.isFormPublished"
      v-model="form.schedule.enabled"
      disabled
      class="my-0"
    >
      <template #label>
        The Form Submissions Schedule will be available in the Form Settings
        after the form is published.
      </template>
    </v-checkbox>

    <v-checkbox
      v-if="formStore.isFormPublished"
      v-model="form.schedule.enabled"
      class="my-0"
    >
      <template #label>
        Form Submissions Schedule
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
            >Experimental
            <a
              :href="githubLinkScheduleAndReminderFeature"
              class="preview_info_link_field_white"
              :target="'_blank'"
            >
              Learn more
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
        <span>Submitters can <strong>Copy an existing submission</strong></span>
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
            >Experimental
            <a
              :href="githubLinkCopyFromExistingFeature"
              class="preview_info_link_field_white"
              :target="'_blank'"
            >
              Learn more
              <v-icon
                icon="mdi:mdi-arrow-top-right-bold-box-outline"
              ></v-icon></a
          ></span>
        </v-tooltip>
      </template>
    </v-checkbox>
  </BasePanel>
</template>
