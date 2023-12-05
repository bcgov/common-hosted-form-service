<script setup>
import { ref, computed } from 'vue';
import { useFormStore } from '~/store/form';
import { Ministries } from '~/utils/constants';
import { i18n } from '~/internationalization';

const formStore = useFormStore();

const ministryRules = ref([
  (v) => {
    return !!v || i18n.t('trans.formProfile.selectMinistryErr');
  },
]);

const form = computed(() => formStore.form);
const lang = computed(() => formStore.lang);
const isRTL = computed(() => formStore.isRTL);

const MinistryList = computed(() => {
  return Ministries.map((ministry) => ({
    id: ministry.id,
    text: i18n.t(`trans.ministries.${ministry.id}`),
  }));
});
</script>

<template>
  <div class="ml-1 mb-4" :lang="lang">
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
