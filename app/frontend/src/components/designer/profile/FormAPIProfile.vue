<script setup>
import { ref, computed } from 'vue';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';

const formStore = useFormStore();
const apiRules = ref([(v) => v != null || 'trans.formProfile.selectAPI']);
const lang = computed(() => formStore.lang);
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="lang">{{
        $t('trans.formProfile.APIIntegration')
      }}</span></template
    >

    <v-radio-group v-model="formStore.form.apiIntegration" :rules="apiRules">
      <v-radio
        class="mb-4"
        :class="{ 'dir-rtl': formStore.isRTL }"
        :value="true"
      >
        <template #label>
          <span :class="{ 'mr-2': formStore.isRTL }" :lang="lang">
            {{ $t('trans.formProfile.Y') }}
          </span>
        </template>
      </v-radio>

      <v-radio
        class="mb-4"
        :class="{ 'dir-rtl': formStore.isRTL }"
        :value="false"
      >
        <template #label>
          <span :class="{ 'mr-2': formStore.isRTL }" :lang="lang">
            {{ $t('trans.formProfile.N') }}
          </span>
        </template>
      </v-radio>
    </v-radio-group>
  </BasePanel>
</template>
