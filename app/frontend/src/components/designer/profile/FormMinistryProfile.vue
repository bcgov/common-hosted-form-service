<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormStore } from '~/store/form';
import { Ministries } from '~/utils/constants';

const { t, locale } = useI18n({ useScope: 'global' });

const formStore = useFormStore();

const ministryRules = ref([
  (v) => {
    return !!v || t('trans.formProfile.selectMinistryErr');
  },
]);

const form = computed(() => formStore.form);
const isRTL = computed(() => formStore.isRTL);

const MinistryList = computed(() => {
  return Ministries.map((ministry) => ({
    id: ministry.id,
    text: t(`trans.ministries.${ministry.id}`),
  }));
});
</script>

<template>
  <div class="ml-1 mb-4" :lang="locale">
    <span v-if="!form.ministry" class="text-danger"><strong>*</strong></span>
    {{ $t('trans.formProfile.ministryPrompt') }}
  </div>
  <v-autocomplete
    v-model="form.ministry"
    class=""
    :class="{ label: isRTL }"
    :rules="ministryRules"
    :label="$t('trans.formProfile.ministryName')"
    :items="MinistryList"
    item-title="text"
    item-value="id"
  ></v-autocomplete>
</template>
