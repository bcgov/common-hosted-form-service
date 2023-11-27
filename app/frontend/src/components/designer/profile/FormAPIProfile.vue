<script setup>
import { ref, computed } from 'vue';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';
import { i18n } from '~/internationalization';

const formStore = useFormStore();
const apiRules = ref([
  (v) => v != null || i18n.t('trans.formProfile.selectAPI'),
]);
const form = computed(() => formStore.form);
const lang = computed(() => formStore.lang);
const isRTL = computed(() => formStore.isRTL);
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="lang">{{
        $t('trans.formProfile.APIIntegration')
      }}</span></template
    >

    <v-radio-group v-model="form.apiIntegration" :rules="apiRules">
      <v-radio class="mb-4" :class="{ 'dir-rtl': isRTL }" :value="true">
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.formProfile.Y') }}
          </span>
        </template>
      </v-radio>

      <v-radio class="mb-4" :class="{ 'dir-rtl': isRTL }" :value="false">
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.formProfile.N') }}
          </span>
        </template>
      </v-radio>
    </v-radio-group>
  </BasePanel>
</template>
