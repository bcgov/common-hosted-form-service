<script>
import { mapActions, mapState } from 'pinia';

import { i18n } from '~/internationalization';

import { useAdminStore } from '~/store/admin';
import { useFormStore } from '~/store/form';
import BaseDialog from '~/components/base/BaseDialog.vue';

export default {
  components: {
    BaseDialog,
  },
  data() {
    return {
      loading: true,
      search: '',
      editDialog: {
        title: '',
        item: {
          id: null,
          formName: null,
          ministry: null,
          ministryText: null,
          name: null,
          endpointUrl: null,
          code: null,
          allowSendUserToken: false,
        },
        show: false,
      },
    };
  },
  computed: {
    ...mapState(useAdminStore, ['externalAPIList', 'externalAPIStatusCodes']),
    ...mapState(useFormStore, ['isRTL', 'lang']),
    headers() {
      return [
        {
          title: i18n.t('trans.adminAPIsTable.ministry'),
          align: 'start',
          key: 'ministry',
        },
        {
          title: i18n.t('trans.adminAPIsTable.ministryName'),
          align: 'start',
          key: 'ministryName',
          // we don't want to see this (too long)
          // but we need it for searching, so it needs to be in the DOM
          headerProps: {
            class: 'hidden',
          },
          cellProps: {
            class: 'hidden',
          },
        },
        {
          title: i18n.t('trans.adminAPIsTable.formName'),
          align: 'start',
          key: 'formName',
        },
        {
          title: i18n.t('trans.adminAPIsTable.formId'),
          align: 'start',
          key: 'formId',
        },
        {
          title: i18n.t('trans.adminAPIsTable.name'),
          align: 'start',
          key: 'name',
        },
        {
          title: i18n.t('trans.adminAPIsTable.display'),
          align: 'start',
          key: 'display',
        },
        {
          title: i18n.t('trans.adminAPIsTable.actions'),
          align: 'end',
          key: 'actions',
          filterable: false,
          sortable: false,
        },
      ];
    },
    items() {
      // add ministry name to objects so we can search on them
      return this.externalAPIList.map((x) => ({
        ...x,
        ministryName: this.getMinistryName(x),
      }));
    },
  },
  async mounted() {
    await this.getExternalAPIStatusCodes();
    await this.getExternalAPIs();
    this.loading = false;
  },
  methods: {
    ...mapActions(useAdminStore, [
      'getExternalAPIs',
      'updateExternalAPI',
      'getExternalAPIStatusCodes',
    ]),
    getMinistryName(item) {
      return item.ministry ? i18n.t(`trans.ministries.${item.ministry}`) : '';
    },
    resetEditDialog() {
      this.editDialog = {
        title: '',
        item: {
          id: null,
          formName: null,
          ministry: null,
          name: null,
          endpointUrl: null,
          code: null,
          allowSendUserToken: false,
        },
        show: false,
      };
    },
    handleEdit(item) {
      this.resetEditDialog();
      this.editDialog.item = { ...item };
      this.editDialog.item.ministryText = this.getMinistryName(item);
      this.editDialog.title = i18n.t('trans.adminAPIsTable.editTitle');
      this.editDialog.show = true;
    },
    async saveItem() {
      await this.updateExternalAPI(
        this.editDialog.item.id,
        this.editDialog.item
      );

      // reset and close on success...
      this.resetEditDialog();
      // reload data...
      this.loading = true;
      await this.getExternalAPIs();
      this.loading = false;
    },
  },
};
</script>

<template>
  <div>
    <v-row no-gutters>
      <v-spacer />
      <v-col cols="12">
        <!-- search input -->
        <div
          class="submissions-search"
          :class="isRTL ? 'float-left' : 'float-right'"
        >
          <v-text-field
            v-model="search"
            density="compact"
            variant="underlined"
            :label="$t('trans.adminAPIsTable.search')"
            append-inner-icon="mdi-magnify"
            single-line
            hide-details
            class="pb-5"
            :class="{ 'dir-rtl': isRTL, label: isRTL }"
            :lang="lang"
          />
        </div>
      </v-col>
    </v-row>

    <!-- table header -->
    <v-data-table
      class="submissions-table"
      hover
      :headers="headers"
      item-key="title"
      :items="items"
      :search="search"
      :loading="loading"
      :loading-text="$t('trans.adminAPIsTable.loadingText')"
      :lang="lang"
    >
      <template #item.ministry="{ item }">
        {{ item.ministry }}
      </template>
      <template #item.ministryName="{ item }">
        {{ getMinistryName(item) }}
      </template>
      <template #item.formName="{ item }">
        {{ item.formName }}
      </template>
      <template #item.endpointUrl="{ item }">
        {{ item.formId }}
      </template>
      <template #item.name="{ item }">
        {{ item.name }}
      </template>
      <template #item.display="{ item }">
        {{ item.display }}
      </template>
      <template #item.actions="{ item }">
        <span>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="primary"
                class="mx-1"
                icon
                v-bind="props"
                variant="text"
                :title="$t('trans.adminAPIsTable.edit')"
                @click="handleEdit(item)"
              >
                <v-icon icon="mdi:mdi-pencil"></v-icon>
              </v-btn>
            </template>
            <span :lang="lang">{{ $t('trans.adminAPIsTable.edit') }}</span>
          </v-tooltip>
        </span>
      </template>
    </v-data-table>
  </div>
  <BaseDialog
    v-model="editDialog.show"
    eager
    type="CONTINUE"
    show-close-button
    :class="{ 'dir-rtl': isRTL }"
    :title="editDialog.title"
    width="1200"
    @continue-dialog="saveItem"
    @close-dialog="editDialog.show = false"
    ><template #title>{{ editDialog.title }}</template>
    <template #text>
      <v-form ref="form" @submit="saveItem()" @submit.prevent>
        <v-text-field
          v-model="editDialog.item.ministryText"
          aria-readonly="true"
          :readonly="true"
          density="compact"
          solid
          variant="outlined"
          :label="$t('trans.adminAPIsTable.ministry')"
          :lang="lang"
        />

        <v-text-field
          v-model="editDialog.item.formName"
          aria-readonly="true"
          :readonly="true"
          density="compact"
          solid
          variant="outlined"
          :label="$t('trans.adminAPIsTable.formName')"
          :lang="lang"
        />

        <v-text-field
          v-model="editDialog.item.name"
          aria-readonly="true"
          :readonly="true"
          density="compact"
          solid
          variant="outlined"
          :label="$t('trans.adminAPIsTable.name')"
          :lang="lang"
        />

        <v-text-field
          v-model="editDialog.item.endpointUrl"
          aria-readonly="true"
          :readonly="true"
          density="compact"
          solid
          variant="outlined"
          :label="$t('trans.adminAPIsTable.endpointUrl')"
          :lang="lang"
        />

        <v-select
          v-model="editDialog.item.code"
          :items="externalAPIStatusCodes"
          item-title="display"
          item-value="code"
          :label="$t('trans.adminAPIsTable.display')"
          density="compact"
          solid
          variant="outlined"
          :lang="lang"
        ></v-select>
        <v-checkbox
          v-model="editDialog.item.allowSendUserToken"
          class="my-0 pt-0"
        >
          <template #label>
            <span :class="{ 'mr-2': isRTL }" :lang="lang">
              {{ $t('trans.adminAPIsTable.allowSendUserToken') }}
            </span>
          </template>
        </v-checkbox>
      </v-form>
    </template>
    <template #button-text-continue>
      <span :lang="lang">{{ $t('trans.externalAPI.save') }}</span>
    </template>
  </BaseDialog>
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
