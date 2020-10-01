<template>
  <div>
    <!-- search input -->
    <div class="submissions-search mt-6 mt-sm-0">
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
        class="pb-5"
      />
    </div>
    <!-- table header -->
    <v-data-table
      class="submissions-table"
      :headers="headers"
      item-key="title"
      :items="forms"
      :search="search"
      :loading="loading"
      loading-text="Loading... Please wait"
    >
      <template v-slot:item.actions="{ item }">
        <v-btn v-if="checkFormManage(item)" color="textLink" text small>
          <router-link :to="{ name: 'FormManage', query: { formId: item.id } }">
            <v-icon class="mr-1">build_circle</v-icon>
            <span>MANAGE</span>
          </router-link>
        </v-btn>
        <v-btn v-if="checkSubmissionView(item)" color="textLink" text small>
          <router-link :to="{ name: 'FormSubmissions', query: { formId: item.id }}">
            <v-icon class="mr-1">remove_red_eye</v-icon>
            <span>VIEW SUBMISSIONS</span>
          </router-link>
        </v-btn>
        <v-btn v-if="checkFormSubmit(item)" color="textLink" text small>
          <router-link :to="{ name: 'FormSubmit', query: { formId: item.id, versionId: item.currentVersionId } }">
            <v-icon class="mr-1">note_add</v-icon>
            <span>SUBMIT</span>
          </router-link>
        </v-btn>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import rbacService from '@/services/rbacService';
import { checkFormManage, checkFormSubmit, checkSubmissionView } from '@/utils/permissionUtils';

export default {
  name: 'FormsTable',
  data() {
    return {
      alertMessage: '',
      alertShow: false,
      alertType: null,
      headers: [
        { text: 'Form Title', align: 'start', value: 'name' },
        {
          text: 'Actions',
          align: 'end',
          value: 'actions',
          filterable: false,
          sortable: false,
        },
      ],
      forms: [],
      loading: true,
      search: '',
    };
  },
  methods: {
    checkFormManage: checkFormManage,
    checkFormSubmit: checkFormSubmit,
    checkSubmissionView: checkSubmissionView,
    async populateFormTable() {
      try {
        // Get this user's permissions
        const response = await rbacService.getCurrentUser();
        const data = response.data;
        // Build up the list of forms for the table
        const forms = data.forms.map((f) => {
          return {
            currentVersionId: f.formVersionId,
            id: f.formId,
            idps: f.idps,
            name: f.formName,
            permissions: f.permissions
          };
        });
        this.forms = forms;
      } catch (error) {
        console.error(`Error getting user data: ${error}`); // eslint-disable-line no-console
      } finally {
        this.loading = false;
      }
    }
  },
  mounted() {
    this.populateFormTable();
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
  .submissions-table >>> th {
    vertical-align: top;
  }
}
/* Want to use scss but the world hates me */
.submissions-table >>> tbody tr:nth-of-type(odd) {
  background-color: #f5f5f5;
}
.submissions-table >>> thead tr th {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
