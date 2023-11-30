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

const form = formStore.form;
const MinistryList = computed(() => Ministries);
</script>

<template>
  <div class="ml-1 mt-lg-2 mb-9">
    {{ $t('trans.formProfile.ministryPrompt') }}
  </div>
  <v-autocomplete
    v-model="form.ministry"
    class="mt-lg-n3"
    :rules="ministryRules"
    :label="$t('trans.formProfile.ministryName')"
    :items="MinistryList"
    item-title="text"
    item-value="id"
  ></v-autocomplete>
</template>
