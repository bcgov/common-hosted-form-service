<script>
import { mapState, mapWritableState } from 'pinia';
import FormAccessSettings from '~/components/designer/settings/FormAccessSettings.vue';
import FormGeneralSettings from '~/components/designer/settings/FormGeneralSettings.vue';
import FormFunctionalitySettings from '~/components/designer/settings/FormFunctionalitySettings.vue';
import FormScheduleSettings from '~/components/designer/settings/FormScheduleSettings.vue';
import FormSubmissionSettings from '~/components/designer/settings/FormSubmissionSettings.vue';
import { useFormStore } from '~/store/form';

export default {
  components: {
    FormAccessSettings,
    FormGeneralSettings,
    FormFunctionalitySettings,
    FormScheduleSettings,
    FormSubmissionSettings,
  },
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...mapWritableState(useFormStore, ['form']),
    ...mapState(useFormStore, ['isFormPublished', 'isRTL']),
  },
};
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
    </v-row>
  </v-container>
</template>
