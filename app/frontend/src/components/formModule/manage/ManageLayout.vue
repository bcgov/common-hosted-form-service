<script setup>
import { storeToRefs } from 'pinia';
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

import ManageFormModule from '~/components/formModule/manage/ManageFormModule.vue';
import ManageFormModuleActions from '~/components/formModule/manage/ManageFormModuleActions.vue';
import { useFormModuleStore } from '~/store/formModule';

const { locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  fm: {
    type: String,
    required: true,
  },
});

const loading = ref(true);

const formModuleStore = useFormModuleStore();

const { formModule } = storeToRefs(formModuleStore);

onMounted(async () => {
  loading.value = true;
  await Promise.all([
    formModuleStore.fetchFormModule(properties.fm),
    formModuleStore.getFormModuleVersionList(properties.fm),
  ]);
  loading.value = false;
});
</script>

<template>
  <div>
    <v-row class="mt-6" no-gutters>
      <!-- page title -->
      <v-col cols="12" sm="6" order="2" order-sm="1">
        <h1 :lang="locale">
          {{ $t('trans.manageFormModuleLayout.manageFormModule') }}
        </h1>
      </v-col>
      <!-- buttons -->
      <v-col class="text-right" cols="12" sm="6" order="1" order-sm="2">
        <v-skeleton-loader :loading="loading" type="actions">
          <ManageFormModuleActions />
        </v-skeleton-loader>
      </v-col>
      <!-- form name -->
      <v-col cols="12" order="3">
        <h3>{{ formModule.pluginName }}</h3>
      </v-col>
    </v-row>
    <v-skeleton-loader :loading="loading" type="list-item-two-line">
      <ManageFormModule />
    </v-skeleton-loader>
  </div>
</template>
