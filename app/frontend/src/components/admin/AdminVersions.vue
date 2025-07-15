<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { exportFormSchema } from '~/composables/form';
import adminService from '~/services/adminService';
import { useAdminStore } from '~/store/admin';
import { useNotificationStore } from '~/store/notification';

const { t, locale } = useI18n({ useScope: 'global' });

const formSchema = ref({
  display: 'form',
  type: 'form',
  components: [],
});

const adminStore = useAdminStore();
const notificationStore = useNotificationStore();

const { form } = storeToRefs(adminStore);

const headers = computed(() => [
  {
    title: t('trans.adminVersions.versions'),
    align: 'start',
    key: 'version',
  },
  {
    title: t('trans.adminVersions.status'),
    align: 'start',
    key: 'status',
  },
  {
    title: t('trans.adminVersions.created'),
    align: 'start',
    key: 'createdAt',
  },
  {
    title: t('trans.adminVersions.lastUpdated'),
    align: 'start',
    key: 'updatedAt',
  },
  {
    title: t('trans.adminVersions.actions'),
    align: 'end',
    key: 'action',
    filterable: false,
    sortable: false,
  },
]);

const versionList = computed(() =>
  form.value?.versions ? form.value.versions : []
);

// ---------------------------------------------/ Publish/unpublish actions
async function onExportClick(id, isDraft) {
  await getFormSchema(id, isDraft);
  exportFormSchema(form.value.name, formSchema.value, form.value.snake);
}

async function getFormSchema(id) {
  try {
    const res = await adminService.readVersion(form.value.id, id);
    formSchema.value = { ...formSchema.value, ...res.data.schema };
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.adminVersions.notificationMsg'),
    });
  }
}
</script>

<template>
  <v-data-table
    class="submissions-table"
    hover
    :headers="headers"
    :items="versionList"
    :lang="locale"
  >
    <!-- Version  -->
    <template #item.version="{ item }">
      <span :lang="locale">
        {{
          $t('trans.adminVersions.version', {
            versionNo: item.version,
          })
        }}
      </span>
    </template>

    <!-- Status  -->
    <template #item.status="{ item }">
      <label :lang="locale">{{
        item.published
          ? $t('trans.adminVersions.published')
          : $t('trans.adminVersions.unpublished')
      }}</label>
    </template>

    <!-- Created date  -->
    <template #item.createdAt="{ item }">
      {{ $filters.formatDateLong(item.createdAt) }}
    </template>

    <!-- Updated at  -->
    <template #item.updatedAt="{ item }">
      {{ $filters.formatDateLong(item.updatedAt) }}
    </template>

    <!-- Actions -->
    <template #item.action="{ item }">
      <!-- export -->
      <span>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              color="primary"
              class="mx-1"
              icon
              v-bind="props"
              :title="$t('trans.documentTemplate.download')"
              @click="onExportClick(item.id, item.isDraft)"
            >
              <v-icon icon="mdi:mdi-download"></v-icon>
            </v-btn>
          </template>
          <span :lang="locale"
            >{{ $t('trans.adminVersions.exportDesign') }}
          </span>
        </v-tooltip>
      </span>
    </template>
  </v-data-table>
</template>

<style scoped>
/* Todo, this is duplicated in a few tables, extract to style */
.submissions-table {
  clear: both;
}
@media (max-width: 1263px) {
  .submissions-table :deep(th) {
    vertical-align: top;
  }
}
.submissions-table :deep(thead tr th) {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
