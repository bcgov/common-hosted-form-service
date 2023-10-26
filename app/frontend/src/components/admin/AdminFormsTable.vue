<script>
import { mapActions, mapState } from 'pinia';
import { i18n } from '~/internationalization';

import { useAdminStore } from '~/store/admin';
import { useFormStore } from '~/store/form';

export default {
  data() {
    return {
      activeOnly: false,
      loading: true,
      search: '',
    };
  },
  computed: {
    ...mapState(useAdminStore, ['formList']),
    ...mapState(useFormStore, ['isRTL', 'lang']),
    calcHeaders() {
      return this.headers.filter(
        (x) => x.key !== 'updatedAt' || this.activeOnly
      );
    },
    headers() {
      return [
        {
          title: i18n.t('trans.adminFormsTable.formTitle'),
          align: 'start',
          key: 'name',
        },
        {
          title: i18n.t('trans.adminFormsTable.created'),
          align: 'start',
          key: 'createdAt',
        },
        {
          title: i18n.t('trans.adminFormsTable.deleted'),
          align: 'start',
          key: 'updatedAt',
        },
        {
          title: i18n.t('trans.adminFormsTable.actions'),
          align: 'end',
          key: 'actions',
          filterable: false,
          sortable: false,
        },
      ];
    },
  },
  async mounted() {
    await this.getForms();
    this.loading = false;
  },
  methods: {
    ...mapActions(useAdminStore, ['getForms']),
    async refreshForms() {
      this.loading = true;
      await this.getForms(!this.activeOnly);
      this.loading = false;
    },
  },
};
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <v-row no-gutters>
      <v-col cols="12" sm="8">
        <v-checkbox
          v-model="activeOnly"
          class="pl-3"
          :class="isRTL ? 'float-right' : 'float-left'"
          :label="$t('trans.adminFormsTable.showDeletedForms')"
          @click="refreshForms"
        >
          <template #label>
            <span :class="{ 'mr-2': isRTL }" :lang="lang">
              {{ $t('trans.adminFormsTable.showDeletedForms') }}
            </span>
          </template>
        </v-checkbox>
      </v-col>

      <v-col cols="12" sm="4">
        <!-- search input -->
        <div
          class="submissions-search"
          :class="isRTL ? 'float-left' : 'float-right'"
        >
          <v-text-field
            v-model="search"
            density="compact"
            variant="underlined"
            :lang="lang"
            :label="$t('trans.adminFormsTable.search')"
            append-inner-icon="mdi-magnify"
            single-line
            hide-details
            class="pb-5"
            :class="{ 'dir-rtl': isRTL, label: isRTL }"
          />
        </div>
      </v-col>
    </v-row>

    <!-- table header -->
    <v-data-table
      class="submissions-table"
      hover
      :headers="calcHeaders"
      item-key="title"
      :items="formList"
      :search="search"
      :loading="loading"
      :lang="lang"
      :loading-text="$t('trans.adminFormsTable.loadingText')"
      :no-data-text="$t('trans.adminFormsTable.noDataText')"
    >
      <template #item.createdAt="{ item }">
        {{ $filters.formatDateLong(item.raw.createdAt) }} -
        {{ item.raw.createdBy }}
      </template>
      <template #item.updatedAt="{ item }">
        {{ $filters.formatDateLong(item.raw.updatedAt) }} -
        {{ item.raw.updatedBy }}
      </template>
      <template #item.actions="{ item }">
        <router-link
          :to="{ name: 'AdministerForm', query: { f: item.raw.id } }"
        >
          <v-btn color="primary" variant="text" size="small">
            <v-icon class="mr-1" icon="mdi:mdi-wrench"></v-icon>
            <span class="d-none d-sm-flex" :lang="lang">{{
              $t('trans.adminFormsTable.admin')
            }}</span>
          </v-btn>
        </router-link>

        <router-link
          :to="{
            name: 'FormSubmit',
            query: { f: item.raw.id },
          }"
          target="_blank"
        >
          <v-btn color="primary" variant="text" size="small">
            <v-icon class="mr-1" icon="mdi:mdi-note-plus"></v-icon>
            <span class="d-none d-sm-flex" :lang="lang">{{
              $t('trans.adminFormsTable.launch')
            }}</span>
          </v-btn>
        </router-link>
      </template>
    </v-data-table>
  </div>
</template>
<style scoped>
/* TODO: Global Style! */
.submissions-search {
  width: 100%;
}
@media (min-width: 600px) {
  .submissions-search {
    max-width: 20em;
    float: right;
  }
}
@media (max-width: 599px) {
  .submissions-search {
    padding-left: 16px;
    padding-right: 16px;
  }
}

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
