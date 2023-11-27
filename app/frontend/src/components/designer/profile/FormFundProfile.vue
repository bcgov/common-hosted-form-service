<script setup>
import { ref } from 'vue';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';
import { i18n } from '~/internationalization';

const formStore = useFormStore();

const fundRules = ref([
  (v) => v !== null || i18n.t('trans.formProfile.selectFund'),
]);

const fundingCostRule = ref([
  (v) => v >= 0 || i18n.t('trans.formProfile.nonNegativeFund'),
]);

const form = formStore.form;
const lang = formStore.lang;
const isRTL = formStore.isRTL;
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="lang">{{
        $t('trans.formProfile.fundingProfile')
      }}</span></template
    >

    <v-radio-group v-model="form.funding" :rules="fundRules">
      <v-radio class="mb-4" :class="{ 'dir-rtl': isRTL }" :value="true">
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.formProfile.Y') }}
          </span>
        </template>
      </v-radio>
      <v-text-field
        v-if="form.funding"
        v-model="form.fundingCost"
        :label="$t('trans.formProfile.projectedFund')"
        :rules="fundingCostRule"
        prefix="$"
        type="number"
        min="0"
      ></v-text-field>
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
