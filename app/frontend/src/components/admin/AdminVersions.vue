<script>
import { mapActions, mapState } from 'pinia';
import { useI18n } from 'vue-i18n';

import adminService from '~/services/adminService';
import { useAdminStore } from '~/store/admin';
import { useNotificationStore } from '~/store/notification';

export default {
  setup() {
    const { t, locale } = useI18n({ useScope: 'global' });

    return { t, locale };
  },
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
    headers() {
      return [
        {
          title: this.$t('trans.adminVersions.versions'),
          align: 'start',
          key: 'version',
        },
        {
          title: this.$t('trans.adminVersions.status'),
          align: 'start',
          key: 'status',
        },
        {
          title: this.$t('trans.adminVersions.created'),
          align: 'start',
          key: 'createdAt',
        },
        {
          title: this.$t('trans.adminVersions.lastUpdated'),
          align: 'start',
          key: 'updatedAt',
        },
        {
          title: this.$t('trans.adminVersions.actions'),
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
          text: this.$t('trans.adminVersions.notificationMsg'),
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
