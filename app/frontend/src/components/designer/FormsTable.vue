<template>
  <div>
    <v-row>
      <v-col cols="12" sm="6">
        <router-link :to="{ name: 'FormCreate' }" v-if="isAdmin">
          <v-btn color="primary" text small v-bind="attrs" v-on="on">
            <v-icon class="mr-1">add_circle</v-icon>
            <span>Create a New Form</span>
          </v-btn>
        </router-link>
      </v-col>

      <v-col cols="12" sm="6">
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
      :items="formList"
      :search="search"
      :loading="loading"
      loading-text="Loading... Please wait"
    >
      <template #[`item.actions`]="{ item }">
        <v-btn v-if="checkFormManage(item)" color="textLink" text small>
          <router-link :to="{ name: 'FormManage', query: { f: item.id } }">
            <v-icon class="mr-1">build_circle</v-icon>
            <span>Manage</span>
          </router-link>
        </v-btn>
        <v-btn v-if="checkSubmissionView(item)" color="textLink" text small>
          <router-link :to="{ name: 'FormSubmissions', query: { f: item.id } }">
            <v-icon class="mr-1">remove_red_eye</v-icon>
            <span>View Submissions</span>
          </router-link>
        </v-btn>
        <v-btn v-if="checkFormSubmit(item)" color="textLink" text small>
          <router-link
            :to="{
              name: 'FormSubmit',
              query: { f: item.id, v: item.currentVersionId },
            }"
            target="_blank"
          >
            <v-icon class="mr-1">note_add</v-icon>
            <span>Launch</span>
          </router-link>
        </v-btn>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import {
  checkFormManage,
  checkFormSubmit,
  checkSubmissionView,
} from '@/utils/permissionUtils';

export default {
  name: 'FormsTable',
  data() {
    return {
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
      loading: true,
      search: '',
    };
  },
  computed: {
    ...mapGetters('form', ['formList']),
    ...mapGetters('auth', ['isAdmin']),
  },
  methods: {
    ...mapActions('form', ['getFormsForCurrentUser']),
    checkFormManage: checkFormManage,
    checkFormSubmit: checkFormSubmit,
    checkSubmissionView: checkSubmissionView,
  },
  async mounted() {
    await this.getFormsForCurrentUser();
    this.loading = false;
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
