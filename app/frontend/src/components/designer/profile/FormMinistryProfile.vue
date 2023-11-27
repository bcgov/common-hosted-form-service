<script setup>
import { ref, computed } from 'vue';
import BasePanel from '~/components/base/BasePanel.vue';
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
const lang = formStore.lang;
const MinistryList = computed(() => Ministries);
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="lang">{{
        $t('trans.formProfile.ministryName')
      }}</span></template
    >

    <v-autocomplete
      v-model="form.ministry"
      :rules="ministryRules"
      :label="$t('trans.formProfile.ministryName')"
      :items="MinistryList"
      item-title="text"
      item-value="id"
    ></v-autocomplete>
  </BasePanel>
</template>
