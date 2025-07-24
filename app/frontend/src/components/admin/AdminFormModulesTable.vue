<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormStore } from '~/store/form';
import { useFormModuleStore } from '~/store/formModule';

const { locale, t } = useI18n({ useScope: 'global' });

const activeOnly = ref(false);
const loading = ref(true);
const search = ref('');

const formStore = useFormStore();
const formModuleStore = useFormModuleStore();

const { isRTL } = storeToRefs(formStore);
const { formModuleList } = storeToRefs(formModuleStore);

const calcHeaders = computed(() =>
  headers.value.filter((x) => x.key !== 'active' || activeOnly.value)
);

const headers = computed(() => [
  {
    title: t('trans.adminFormModulesTable.formModuleName'),
    align: 'start',
    key: 'pluginName',
  },
  {
    title: t('trans.adminFormModulesTable.createdAt'),
    align: 'start',
    key: 'createdAt',
  },
  {
    title: t('trans.adminFormModulesTable.isInactive'),
    align: 'start',
    key: 'active',
  },
  {
    title: t('trans.adminFormModulesTable.actions'),
    align: 'end',
    key: 'actions',
    filterable: false,
    sortable: false,
  },
]);

async function refreshFormModules() {
  loading.value = true;
  await formModuleStore.getFormModuleList(!activeOnly.value);
  loading.value = false;
}

onMounted(async () => {
  await refreshFormModules();
});
</script>
<template>
  <div>
    <v-row class="mt-6" no-gutters>
      <v-col class="text-right">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              class="mx-1"
              color="primary"
              icon="mdi-plus"
              size="x-small"
              :title="$t('trans.adminFormModulesTable.importFormModule')"
              :to="{ name: 'ImportFormModuleView' }"
            >
            </v-btn>
          </template>
          <span :lang="locale">{{
            $t('trans.adminFormModulesTable.importFormModule')
          }}</span>
        </v-tooltip>
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-col cols="12" sm="8">
        <v-checkbox
          v-model="activeOnly"
          class="pl-3"
          :label="$t('trans.adminFormModulesTable.showInactive')"
          @click="refreshFormModules"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <!-- search input -->
        <div class="form-module-versions-search">
          <v-text-field
            v-model="search"
            density="compact"
            variant="underlined"
            append-inner-icon="mdi-magnify"
            single-line
            :label="$t('trans.adminFormModulesTable.search')"
            class="pb-5"
            :class="{ label: isRTL }"
            :loading="loading"
          />
        </div>
      </v-col>
    </v-row>

    <v-data-table
      class="form-modules-table"
      :headers="calcHeaders"
      item-key="title"
      :items="formModuleList"
      :search="search"
      :loading="loading"
      :loading-text="$t('trans.adminFormModulesTable.loadingText')"
      :no-data-text="$t('trans.adminFormModulesTable.noDataText')"
    >
      <template #[`item.actions`]="{ item }">
        <router-link :to="{ name: 'FormModuleManage', query: { fm: item.id } }">
          <v-btn
            color="primary"
            variant="text"
            size="small"
            :title="$t('trans.adminFormModulesTable.manage')"
          >
            <v-icon :class="isRTL ? 'ml-1' : 'mr-1'" icon="mdi:mdi-cog" />
            <span class="d-none d-sm-flex" :lang="locale">{{
              $t('trans.adminFormModulesTable.manage')
            }}</span>
          </v-btn>
        </router-link>
      </template>
    </v-data-table>
  </div>
</template>

<stype scoped>

</stype>
