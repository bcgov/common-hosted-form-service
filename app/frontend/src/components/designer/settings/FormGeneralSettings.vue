<script setup>
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFormStore } from '~/store/form';

const { t } = useI18n({ useScope: 'global' });

/* c8 ignore start */
const nameRules = ref([
  (v) => !!v || t('trans.formSettings.formTitleReq'),
  (v) => (v && v.length <= 255) || t('trans.formSettings.formTitlemaxChars'),
]);

const descriptionRules = ref([
  (v) => {
    if (v) {
      return v.length <= 255 || t('trans.formSettings.formDescriptnMaxChars');
    } else return true;
  },
]);
/* c8 ignore stop */

const { form, lang } = storeToRefs(useFormStore());
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="lang">{{
        $t('trans.formSettings.formTitle')
      }}</span></template
    >
    <v-text-field
      v-model="form.name"
      density="compact"
      solid
      variant="outlined"
      :label="$t('trans.formSettings.formTitle')"
      data-test="text-name"
      :rules="nameRules"
      :lang="lang"
    />

    <v-text-field
      v-model="form.description"
      density="compact"
      solid
      variant="outlined"
      :label="$t('trans.formSettings.formDescription')"
      data-test="text-description"
      :rules="descriptionRules"
      :lang="lang"
    />
  </BasePanel>
</template>
