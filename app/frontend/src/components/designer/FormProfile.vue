<script>
import { mapState } from 'pinia';
import FormDeploymentProfile from '~/components/designer/profile/FormDeploymentProfile.vue';
import FormMinistryProfile from '~/components/designer/profile/FormMinistryProfile.vue';
import FormTagProfile from '~/components/designer/profile/FormTagProfile.vue';
import FormAPIProfile from '~/components/designer/profile/FormAPIProfile.vue';
import FormFundProfile from '~/components/designer/profile/FormFundProfile.vue';
import FormUseCaseProfile from '~/components/designer/profile/FormUseCaseProfile.vue';
import { useFormStore } from '~/store/form';

export default {
  components: {
    FormDeploymentProfile,
    FormMinistryProfile,
    FormTagProfile,
    FormAPIProfile,
    FormFundProfile,
    FormUseCaseProfile,
  },
  computed: {
    ...mapState(useFormStore, ['isRTL', 'lang']),
  },
};
</script>

<template>
  <v-container class="px-0" :class="{ 'dir-rtl': isRTL }">
    <v-row>
      <v-col cols="12" md="6">
        <FormDeploymentProfile />
      </v-col>
      <v-col cols="12" md="6">
        <FormMinistryProfile />
      </v-col>
      <v-col cols="12" md="6">
        <FormAPIProfile />
      </v-col>
      <v-col cols="12" md="6">
        <FormFundProfile />
      </v-col>
      <v-col cols="12" md="6">
        <FormUseCaseProfile />
      </v-col>
      <v-col cols="12" md="6">
        <FormTagProfile />
      </v-col>
    </v-row>
  </v-container>
</template>
