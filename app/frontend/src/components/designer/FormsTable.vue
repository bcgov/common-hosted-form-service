<script>
import { mapActions, mapState } from 'pinia';

import { i18n } from '~/internationalization';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import BaseDialog from '~/components/base/BaseDialog.vue';
import { IdentityProviders } from '~/utils/constants';
import { checkFormManage, checkSubmissionView } from '~/utils/permissionUtils';

export default {
  components: {
    BaseDialog,
  },
  data() {
    return {
      headers: [
        {
          title: i18n.t('trans.formsTable.formTitle'),
          align: 'start',
          key: 'name',
          width: '1%',
        },
        {
          title: i18n.t('trans.formsTable.action'),
          align: 'end',
          key: 'actions',
          filterable: false,
          sortable: false,
          width: '1%',
        },
      ],
      formId: null,
      showDescriptionDialog: false,
      loading: true,
      formDescription: null,
      search: null,
    };
  },
  computed: {
    ...mapState(useFormStore, ['formList']),
    ...mapState(useAuthStore, ['user']),
    canCreateForm() {
      return this.user.idp === IdentityProviders.IDIR;
    },
    filteredFormList() {
      return this.formList.filter(
        (f) => checkFormManage(f) || checkSubmissionView(f)
      );
    },
  },
  async mounted() {
    await this.getFormsForCurrentUser();
    this.loading = false;
  },
  methods: {
    ...mapActions(useFormStore, ['getFormsForCurrentUser']),
    checkFormManage: checkFormManage,
    checkSubmissionView: checkSubmissionView,
    onDescriptionClick(fId, fDescription) {
      this.formId = fId;
      this.formDescription = fDescription;
      this.showDescriptionDialog = true;
    },
  },
};
</script>

<template>
  <div>
    <div
      class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
    >
      <!-- page title -->
      <div>
        <h1>{{ $t('trans.formsTable.myForms') }}</h1>
      </div>
      <!-- buttons -->
      <div v-if="canCreateForm">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <router-link
              v-slot="{ navigate }"
              :to="{ name: 'FormCreate' }"
              custom
            >
              <v-btn
                v-bind="props"
                class="mx-1"
                color="primary"
                icon="mdi-plus"
                role="link"
                size="x-small"
                @click="navigate"
              >
              </v-btn>
            </router-link>
          </template>
          <span>{{ $t('trans.formsTable.createNewForm') }}</span>
        </v-tooltip>
      </div>
    </div>

    <v-row class="my-3" no-gutters>
      <v-spacer />
      <v-col cols="12" sm="4">
        <!-- search input -->
        <div class="submissions-search">
          <v-text-field
            v-model="search"
            density="compact"
            variant="underlined"
            append-inner-icon="mdi-magnify"
            single-line
            :label="$t('trans.formsTable.search')"
            class="pb-5"
          />
        </div>
      </v-col>
    </v-row>
  </div>

  <!-- table header -->
  <v-data-table
    class="submissions-table"
    :headers="headers"
    :items="filteredFormList"
    item-value="name"
    :loading="loading"
    :loading-text="$t('trans.formsTable.loadingText')"
    :search="search"
  >
    <template #item.name="{ item }">
      <router-link
        v-if="item.raw.published"
        :to="{
          name: 'FormSubmit',
          query: { f: item.raw.id },
        }"
        target="_blank"
      >
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <span v-bind="props">{{ item.columns.name }}</span>
          </template>
          <span>
            {{ $t('trans.formsTable.viewForm') }}
            <v-icon icon="mdi:mdi-open-in-new"></v-icon>
          </span>
        </v-tooltip>
      </router-link>
      <span v-else>{{ item.columns.name }}</span>
      <v-icon
        v-if="item.raw.description?.trim()"
        size="small"
        class="description-icon ml-2 mr-4"
        color="primary"
        icon="mdi:mdi-note-text"
        @click="onDescriptionClick(item.raw.id, item.raw.description)"
      ></v-icon>
    </template>
    <template #item.actions="{ item }">
      <router-link
        v-if="checkFormManage(item.raw)"
        :to="{ name: 'FormManage', query: { f: item.raw.id } }"
      >
        <v-btn color="primary" variant="text" size="small">
          <v-icon class="mr-1" icon="mdi:mdi-cog"></v-icon>
          <span class="d-none d-sm-flex">{{
            $t('trans.formsTable.manage')
          }}</span>
        </v-btn>
      </router-link>
      <router-link
        v-if="checkSubmissionView(item.raw)"
        data-cy="formSubmissionsLink"
        :to="{ name: 'FormSubmissions', query: { f: item.raw.id } }"
      >
        <v-btn color="primary" variant="text" size="small">
          <v-icon class="mr-1" icon="mdi:mdi-list-box-outline"></v-icon>
          <span class="d-none d-sm-flex">{{
            $t('trans.formsTable.submissions')
          }}</span>
        </v-btn>
      </router-link>
    </template>
  </v-data-table>

  <BaseDialog
    v-model="showDescriptionDialog"
    show-close-button
    @close-dialog="showDescriptionDialog = false"
  >
    <template #title>
      <span class="pl-5">{{ $t('trans.formsTable.Description') }}</span>
    </template>
    <template #text>
      <slot name="formDescription">{{ formDescription }}</slot>
    </template>
  </BaseDialog>
</template>

<style scoped>
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
/* Want to use scss but the world hates me */
.submissions-table :deep(tbody) tr:nth-of-type(odd) {
  background-color: #f5f5f5;
}
.submissions-table :deep(thead) tr th {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
.submissions-table a {
  color: #003366;
}
.description-icon:focus::after {
  opacity: 0;
}
</style>
