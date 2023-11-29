<script setup>
import { ref, computed } from 'vue';
import { useFormStore } from '~/store/form';
import { Ministries } from '~/utils/constants';
import { i18n } from '~/internationalization';

const formStore = useFormStore();

const ministryRules = ref([
  (v) => {
    return !!v || i18n.t('trans.formProfile.selectMinistry');
  },
]);

const form = formStore.form;
const MinistryList = computed(() => Ministries);
</script>

<template>
  <v-autocomplete
    v-model="form.ministry"
    :rules="ministryRules"
    :label="$t('trans.formProfile.ministryName')"
    :items="MinistryList"
    item-title="text"
    item-value="id"
  ></v-autocomplete>
</template>
