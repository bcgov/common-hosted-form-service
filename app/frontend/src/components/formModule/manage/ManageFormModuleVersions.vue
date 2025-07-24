<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormModuleStore } from '~/store/formModule';

const { locale, t } = useI18n({ useScope: 'global' });

const formModuleStore = useFormModuleStore();
const { formModuleVersionList } = storeToRefs(formModuleStore);

const rerenderTable = ref(0);

const headers = computed(() => [
  {
    title: t('trans.manageFormModuleVersions.version'),
    align: 'start',
    key: 'version',
  },
  {
    title: t('trans.manageFormModuleVersions.createdAt'),
    align: 'start',
    key: 'createdAt',
  },
  {
    title: t('trans.manageFormModuleVersions.createdBy'),
    align: 'start',
    key: 'createdBy',
  },
  {
    title: t('trans.manageFormModuleVersions.actions'),
    align: 'end',
    key: 'action',
    filterable: false,
    sortable: false,
    width: 200,
  },
]);

const versionList = computed(() => {
  if (!formModuleVersionList.value) return [];
  return formModuleVersionList.value.map((fmv, index) => {
    fmv.version = formModuleVersionList.value.length - index;
    return fmv;
  });
});
</script>

<template>
  <div>
    <BaseInfoCard class="my-4">
      <h4 class="text-primary">
        <v-icon class="mr-1" color="primary">info</v-icon
        >{{ $t('trans.manageFormModuleVersions.important') }}
      </h4>
      <p>
        {{ $t('trans.manageFormModuleVersions.importantDescription') }}
      </p>
    </BaseInfoCard>

    <div class="mt-8 mb-5">
      <v-icon class="mr-1" color="primary">info</v-icon
      >{{ $t('trans.manageFormModuleVersions.info') }}
    </div>

    <v-data-table
      :key="rerenderTable"
      class="form-module-versions-table"
      :headers="headers"
      :items="versionList"
    >
      <!-- Version -->
      <template #[`item.version`]="{ item }">
        <span :lang="locale">{{
          $t('trans.manageFormModuleVersions.tableTemplateVersion', {
            version: item.version,
          })
        }}</span>
      </template>

      <!-- Created date  -->
      <template #[`item.createdAt`]="{ item }">
        {{ item.createdAt }}
      </template>

      <!-- Created by  -->
      <template #[`item.createdBy`]="{ item }">
        {{ item.createdBy }}
      </template>

      <!-- Actions -->
      <template #[`item.action`]="{ item }">
        <span>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <router-link
                :to="{
                  name: 'FormModuleVersionManage',
                  query: { fm: item.formModuleId, fmv: item.id },
                }"
              >
                <v-btn
                  color="primary"
                  class="mx-1"
                  icon="mdi:mdi-cog"
                  v-bind="props"
                >
                </v-btn>
              </router-link>
            </template>
            <span :lang="locale">{{
              $t('trans.manageFormModuleVersions.tableTemplateVersion', {
                version: item.version,
              })
            }}</span>
          </v-tooltip>
        </span>
      </template>
    </v-data-table>
  </div>
</template>
