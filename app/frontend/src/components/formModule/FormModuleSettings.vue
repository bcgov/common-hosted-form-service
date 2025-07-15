<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormModuleStore } from '~/store/formModule';
import { IdentityProviders } from '~/utils/constants';

const { t, locale } = useI18n({ useScope: 'global' });

const pluginNameRules = [
  (v) => !!v || t('trans.formModuleSettings.pluginNameRequired'),
  (v) =>
    (v && v.length <= 255) || t('trans.formModuleSettings.pluginNameMaxLength', { length: 255 }),
];
const isLoading = ref(true);

const formModuleStore = useFormModuleStore();
const { formModule } = storeToRefs(formModuleStore);

const ID_PROVIDERS = computed(() => Object.values(IdentityProviders));

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
          <div v-for="idp in ID_PROVIDERS" :key="idp">
            <v-checkbox
              v-if="formModule.id"
              v-model="formModule.idpTypes"
              class="my-0"
              :value="idp"
            >
              <template #label>
                <span>{{ idp }}</span>
              </template>
            </v-checkbox>
            <v-checkbox
              v-else
              v-model="formModule.idpTypes"
              class="my-0"
              :value="idp"
            >
              <template #label>
                <span>{{ idp }}</span>
              </template>
            </v-checkbox>
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
