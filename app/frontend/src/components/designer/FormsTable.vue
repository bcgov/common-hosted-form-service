<template>
  <div class="forms-table">
    <v-row class="mt-6" no-gutters>
      <!-- page title -->
      <v-col cols="12" sm="6" order="2" order-sm="1">
        <h1>My Forms</h1>
      </v-col>
      <!-- buttons -->
      <v-col
        v-if="user.idp === ID_PROVIDERS.IDIR"
        class="text-right"
        cols="12"
        sm="6"
        order="1"
        order-sm="2"
      >
        <v-tooltip location="bottom">
          <router-link
            :to="{ name: 'FormCreate' }"
            custom
            v-slot="{ navigate }"
          >
            <v-btn
              class="mx-1"
              color="primary"
              icon
              @click="navigate"
              role="link"
            >
              <v-icon>add_circle</v-icon>
            </v-btn>
          </router-link>
          <span>Create a New Form</span>
        </v-tooltip>
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-spacer />
      <v-col cols="12" sm="4">
        <!-- search input -->
        <div class="submissions-search">
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search"
            single-line
            hide-details
            class="pb-5"
          />
        </div>
      </v-col>
    </v-row>

    <!-- table header -->
    <v-data-table
      class="submissions-table"
      :headers="headers"
      item-key="title"
      :items="filteredFormList"
      :search="search"
      :loading="loading"
      loading-text="Loading... Please wait"
    >
      <template v-slot:item.name="{ item }">
        <router-link
          v-if="item.raw.published"
          :to="{
            name: 'FormSubmit',
            query: { f: item.raw.id },
          }"
          target="_blank"
        >
          <span>{{ item.raw.name }}</span>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <span v-bind="props">{{ item.raw.name }}</span>
            </template>
            <span v-if="item.raw.published">
              View Form
              <v-icon>open_in_new</v-icon>
            </span>
          </v-tooltip>
        </router-link>
        <span v-else>{{ item.raw.name }}</span>
        <!-- link to description in dialog -->
        <v-icon
          v-if="item.raw.description?.trim()"
          size="small"
          class="description-icon ml-2 mr-4"
          color="primary"
          @click="onDescriptionClick(item.raw.id, item.raw.description)"
        >
          description
        </v-icon>
      </template>
      <template v-slot:item.actions="{ item }">
        <router-link
          v-if="checkFormManage(item.raw)"
          :to="{ name: 'FormManage', query: { f: item.raw.id } }"
        >
          <v-btn color="primary" variant="text" size="small">
            <v-icon class="mr-1">settings</v-icon>
            <span class="d-none d-sm-flex">Manage</span>
          </v-btn>
        </router-link>
        <router-link
          v-if="checkSubmissionView(item.raw)"
          data-cy="formSubmissionsLink"
          :to="{ name: 'FormSubmissions', query: { f: item.raw.id } }"
        >
          <v-btn color="primary" variant="text" size="small">
            <v-icon class="mr-1">list_alt</v-icon>
            <span class="d-none d-sm-flex">Submissions</span>
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
        <span class="pl-5">Description:</span>
      </template>
      <template #text>
        <slot name="formDescription">{{ formDescription }}</slot>
      </template>
    </BaseDialog>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { IdentityProviders } from '@src/utils/constants';
import {
  checkFormManage,
  checkFormSubmit,
  checkSubmissionView,
} from '@src/utils/permissionUtils';

export default {
  name: 'FormsTable',
  data() {
    return {
      // Assigning width: '1%' to dynamically assign width to the Table's Columns as described by this post on Stack Overflow:
      // https://stackoverflow.com/a/51569928
      headers: [
        { title: 'Form Title', align: 'start', key: 'name', width: '1%' },
        {
          title: 'Actions',
          align: 'end',
          key: 'actions',
          filterable: false,
          sortable: false,
          width: '1%',
        },
      ],
      loading: true,
      showDescriptionDialog: false,
      formId: null,
      formDescription: null,
      search: '',
    };
  },
  computed: {
    ...mapGetters('form', ['formList']),
    ...mapGetters('auth', ['user']),
    filteredFormList() {
      // At this point, we're only showing forms you can manage or view submissions of here
      // This may get reconceptualized in the future to different pages or something
      return this.formList.filter(
        (f) => checkFormManage(f) || checkSubmissionView(f)
      );
    },
    ID_PROVIDERS: () => IdentityProviders,
  },
  async mounted() {
    await this.getFormsForCurrentUser();
    this.loading = false;
  },
  methods: {
    ...mapActions('form', ['getFormsForCurrentUser']),
    checkFormManage: checkFormManage,
    checkFormSubmit: checkFormSubmit,
    checkSubmissionView: checkSubmissionView,
    // show a description if is set in db
    onDescriptionClick(formId, formDescription) {
      this.formId = formId;
      this.formDescription = formDescription;
      this.showDescriptionDialog = true;
    },
  },
};
</script>

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
