<script setup>
import { storeToRefs } from 'pinia';

import FormGeneralSettings from '~/components/designer/settings/FormGeneralSettings.vue';
import FormAccessSettings from '~/components/designer/settings/FormAccessSettings.vue';
import FormFunctionalitySettings from '~/components/designer/settings/FormFunctionalitySettings.vue';
import FormSubmissionSettings from '~/components/designer/settings/FormSubmissionSettings.vue';
import FormScheduleSettings from '~/components/designer/settings/FormScheduleSettings.vue';
import FormMetadataSettings from '~/components/designer/settings/FormMetadataSettings.vue';
import { useFormStore } from '~/store/form';

defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
});

const { form, isFormPublished, isRTL } = storeToRefs(useFormStore());
</script>

<template>
  <v-container class="px-0" :class="{ 'dir-rtl': isRTL }">
    <v-row>
      <v-col cols="12" md="6">
        <FormGeneralSettings />
      </v-col>
      <v-col cols="12" md="6">
        <FormAccessSettings />
      </v-col>
      <v-col cols="12" md="6">
        <FormFunctionalitySettings :disabled="disabled" />
      </v-col>
      <v-col cols="12" md="6">
        <FormSubmissionSettings />
      </v-col>
      <v-col v-if="form.schedule.enabled && isFormPublished" cols="12" md="6">
        <FormScheduleSettings />
      </v-col>
      <v-col cols="12" md="6">
        <FormMetadataSettings :disabled="disabled" />
      </v-col>
    </v-row>
  </v-container>
</template>
