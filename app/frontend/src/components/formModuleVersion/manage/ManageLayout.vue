<script setup>
import { storeToRefs } from 'pinia';
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

import ManageFormModuleVersion from '~/components/formModuleVersion/manage/ManageFormModuleVersion.vue';
import { useFormModuleStore } from '~/store/formModule';

const { locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  fm: {
    type: String,
    required: true,
  },
  fmv: {
    type: String,
    required: true,
  },
});

const formModuleStore = useFormModuleStore();
const { formModule } = storeToRefs(formModuleStore);

const loading = ref(true);

onMounted(async () => {
  loading.value = true;
  await Promise.all([
    formModuleStore.fetchFormModule(properties.fm),
    formModuleStore.fetchFormModuleVersion(properties.fmv),
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
          {{
            $t('trans.formModuleVersionManageLayout.manageFormModuleVersion')
          }}
        </h1>
      </v-col>
      <!-- form name -->
      <v-col cols="12" order="3">
        <h3>{{ formModule.pluginName }}</h3>
      </v-col>
    </v-row>
    <v-skeleton-loader :loading="loading" type="list-item-two-line">
      <ManageFormModuleVersion />
    </v-skeleton-loader>
  </div>
</template>

