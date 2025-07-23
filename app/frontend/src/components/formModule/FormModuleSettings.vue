<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormStore } from '~/store/form';
import { useFormModuleStore } from '~/store/formModule';
import { useIdpStore } from '~/store/identityProviders';

const { t } = useI18n({ useScope: 'global' });

const pluginNameRules = [
  (v) => !!v || t('trans.formModuleSettings.pluginNameRequired'),
  (v) =>
    (v && v.length <= 255) ||
    t('trans.formModuleSettings.pluginNameMaxLength', { length: 255 }),
];
const isLoading = ref(true);

const formStore = useFormStore();
const formModuleStore = useFormModuleStore();
const idpStore = useIdpStore();

const { isRTL } = storeToRefs(formStore);
const { formModule } = storeToRefs(formModuleStore);
const { loginButtons } = storeToRefs(idpStore);

onMounted(() => {
  nextTick(() => {
    isLoading.value = false;
  });
});
</script>
<template>
  <v-container class="px-0">
    <v-row>
      <v-col>
        <BasePanel class="fill-height">
          <template #title>{{
            $t('trans.formModuleSettings.formModulePluginName')
          }}</template>
          <v-text-field
            v-model="formModule.pluginName"
            density="compact"
            flat
            solid
            variant="outlined"
            :label="$t('trans.formModuleSettings.pluginName')"
            name="pluginName"
            :rules="pluginNameRules"
          />
        </BasePanel>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <BasePanel class="fill-height">
          <template #title>{{
            $t('trans.formModuleSettings.formDesignerIDPAccess')
          }}</template>
          <div>
            <v-checkbox
              v-for="btn in loginButtons"
              :key="btn.code"
              v-model="formModule.idpTypes"
              :label="btn.display"
              :value="btn.code"
              class="my-0"
              hide-details="auto"
              :data-test="`idpType-${btn.hint}`"
              :class="{ 'dir-rtl': isRTL }"
            />
          </div>
        </BasePanel>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>
@import '~font-awesome/css/font-awesome.min.css';
@import '~formiojs/dist/formio.builder.min.css';
</style>
