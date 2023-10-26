<script>
import { mapActions, mapState } from 'pinia';

import { i18n } from '~/internationalization';
import adminService from '~/services/adminService';
import { useAdminStore } from '~/store/admin';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

export default {
  data() {
    return {
      formSchema: {
        display: 'form',
        type: 'form',
        components: [],
      },
    };
  },
  computed: {
    ...mapState(useAdminStore, ['form']),
    ...mapState(useFormStore, ['lang']),
    headers() {
      return [
        {
          title: i18n.t('trans.adminVersions.versions'),
          align: 'start',
          key: 'version',
        },
        {
          title: i18n.t('trans.adminVersions.status'),
          align: 'start',
          key: 'status',
        },
        {
          title: i18n.t('trans.adminVersions.created'),
          align: 'start',
          key: 'createdAt',
        },
        {
          title: i18n.t('trans.adminVersions.lastUpdated'),
          align: 'start',
          key: 'updatedAt',
        },
        {
          title: i18n.t('trans.adminVersions.actions'),
          align: 'end',
          key: 'action',
          filterable: false,
          sortable: false,
        },
      ];
    },
    versionList() {
      return this.form ? this.form.versions : [];
    },
  },
  methods: {
    ...mapActions(useNotificationStore, ['addNotification']),
    // ---------------------------------------------/ Publish/unpublish actions
    async onExportClick(id, isDraft) {
      await this.getFormSchema(id, isDraft);
      let snek = this.form.snake;
      if (!this.form.snake) {
        snek = this.form.name
          .replace(/\s+/g, '_')
          .replace(/[^-_0-9a-z]/gi, '')
          .toLowerCase();
      }

      const a = document.createElement('a');
      a.href = `data:application/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(this.formSchema)
      )}`;
      a.download = `${snek}_schema.json`;
      a.style.display = 'none';
      a.classList.add('hiddenDownloadTextElement');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },

    async getFormSchema(id) {
      try {
        const res = await adminService.readVersion(this.form.id, id);
        this.formSchema = { ...this.formSchema, ...res.data.schema };
      } catch (error) {
        this.addNotification({
          text: i18n.t('trans.adminVersions.notificationMsg'),
        });
      }
    },
  },
};
</script>

<template>
  <v-data-table
    class="submissions-table"
    hover
    :headers="headers"
    :items="versionList"
    :lang="lang"
  >
    <!-- Version  -->
    <template #item.version="{ item }">
      <span :lang="lang">
        {{
          $t('trans.adminVersions.version', {
            versionNo: item.raw.version,
          })
        }}
      </span>
    </template>

    <!-- Status  -->
    <template #item.status="{ item }">
      <label :lang="lang">{{
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
          <span :lang="lang"
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
