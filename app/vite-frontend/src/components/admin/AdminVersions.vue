<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { adminService } from '~/services';
import { useAdminStore } from '~/store/admin';
import { useNotificationStore } from '~/store/notification';

const { t } = useI18n({ useScope: 'global' });

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
    title: t('trans.manageVersions.versions'),
    align: 'start',
    key: 'version',
  },
  {
    title: t('trans.manageVersions.status'),
    align: 'start',
    key: 'status',
  },
  {
    title: t('trans.manageVersions.created'),
    align: 'start',
    key: 'createdAt',
  },
  {
    title: t('trans.manageVersions.lastUpdated'),
    align: 'start',
    key: 'updatedAt',
  },
  {
    title: t('trans.manageVersions.actions'),
    align: 'end',
    key: 'action',
    filterable: false,
    sortable: false,
  },
]);
const versionList = computed(() => (form.value ? form.value.versions : []));

// ----------------------------------------------------------------------/ Publish/unpublish actions
async function onExportClick(id, isDraft) {
  await getFormSchema(id, isDraft);
  let snek = form.value.snake;
  if (!form.value.snake) {
    snek = form.value.name
      .replace(/\s+/g, '_')
      .replace(/[^-_0-9a-z]/gi, '')
      .toLowerCase();
  }

  const a = document.createElement('a');
  a.href = `data:application/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(formSchema.value)
  )}`;
  a.download = `${snek}_schema.json`;
  a.style.display = 'none';
  a.classList.add('hiddenDownloadTextElement');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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
    :headers="headers"
    :items="versionList"
  >
    <!-- Version  -->
    <template #item.version="{ item }">
      <span>
        {{
          $t('trans.adminVersions.version', {
            versionNo: item.raw.version,
          })
        }}
      </span>
    </template>

    <!-- Status  -->
    <template #item.status="{ item }">
      <label>{{
        item.raw.published
          ? $t('trans.adminVersions.published')
          : $t('trans.adminVersions.unpublished')
      }}</label>
    </template>

    <!-- Created date  -->
    <template #item.createdAt="{ item }">
      {{ $filters.formatDateLong(item.raw.createdAt) }}
    </template>

    <!-- Updated at  -->
    <template #item.updatedAt="{ item }">
      {{ $filters.formatDateLong(item.raw.updatedAt) }}
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
              @click="onExportClick(item.raw.id, item.raw.isDraft)"
            >
              <v-icon icon="mdi:mdi-download"></v-icon>
            </v-btn>
          </template>
          <span>{{ $t('trans.adminVersions.exportDesign') }} </span>
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
/* Want to use scss but the world hates me */
.submissions-table :deep(tbody tr:nth-of-type(odd)) {
  background-color: #f5f5f5;
}
.submissions-table :deep(thead tr th) {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
