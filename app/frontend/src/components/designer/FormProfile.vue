<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import FormDeploymentProfile from '~/components/designer/profile/FormDeploymentProfile.vue';
import FormMinistryProfile from '~/components/designer/profile/FormMinistryProfile.vue';
import FormLabelProfile from '~/components/designer/profile/FormLabelProfile.vue';
import FormAPIProfile from '~/components/designer/profile/FormAPIProfile.vue';
import FormUseCaseProfile from '~/components/designer/profile/FormUseCaseProfile.vue';
import { useFormStore } from '~/store/form';
import BasePanel from '~/components/base/BasePanel.vue';

const { locale } = useI18n({ useScope: 'global' });

const formStore = useFormStore();
const isRTL = computed(() => formStore.isRTL);
</script>

<template>
  <BasePanel class="my-6">
    <template #title>
      <span :lang="locale">{{ $t('trans.create.formProfile') }}</span>
    </template>
    <v-container class="px-0" :class="{ 'dir-rtl': isRTL }">
      <div class="mb-6 ml-1 font-weight-bold" :lang="locale">
        {{ $t('trans.formProfile.message') }}
      </div>
      <v-row>
        <v-col cols="12" md="6">
          <FormMinistryProfile />
        </v-col>
        <v-col cols="12" md="6">
          <FormUseCaseProfile />
        </v-col>
        <v-col cols="12" md="6">
          <FormDeploymentProfile />
        </v-col>
        <v-col cols="12" md="6">
          <FormAPIProfile />
        </v-col>
        <v-col>
          <FormLabelProfile />
        </v-col>
      </v-row>
    </v-container>
  </BasePanel>
</template>
