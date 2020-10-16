<template>
  <div>
    <v-row>
      <v-col cols="12" sm="6">
        <ExportSubmissions />
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
            class="pb-5 pt-0 mt-0"
          />
        </div>
      </v-col>
    </v-row>

    <!-- table header -->
    <v-data-table
      class="submissions-table"
      :headers="headers"
      item-key="title"
      :items="submissionTable"
      :search="search"
      :loading="loading"
      loading-text="Loading... Please wait"
    >
      <template #[`item.date`]="{ item }">
        {{ item.date | formatDate }}
      </template>
      <template #[`item.actions`]="{ item }">
        <v-btn color="textLink" text small>
          <router-link
            :to="{
              name: 'FormView',
              query: {
                s: item.submissionId,
              },
            }"
          >
            <v-icon class="mr-1">remove_red_eye</v-icon>
            <span>VIEW</span>
          </router-link>
        </v-btn>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import ExportSubmissions from '@/components/forms/ExportSubmissions.vue';

export default {
  name: 'SubmissionsTable',
  components: {
    ExportSubmissions,
  },
  props: {
    formId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      headers: [
        { text: 'Confirmation ID', align: 'start', value: 'confirmationId' },
        { text: 'Submission Date', align: 'start', value: 'date' },
        { text: 'Submitter', align: 'start', value: 'submitter' },
        {
          text: 'Actions',
          align: 'end',
          value: 'actions',
          filterable: false,
          sortable: false,
        },
      ],
      submissionTable: [],
      loading: true,
      search: '',
    };
  },
  computed: {
    ...mapGetters('form', ['submissionList']),
  },
  methods: {
    ...mapActions('form', ['fetchForm', 'fetchSubmissions']),
    async populateSubmissionsTable() {
      try {
        // Get the submissions for this form
        await this.fetchSubmissions(this.formId);
        // Build up the list of forms for the table
        if (this.submissionList) {
          const tableRows = this.submissionList.map((s) => {
            return {
              confirmationId: s.confirmationId,
              date: s.createdAt,
              formId: s.formId,
              submissionId: s.submissionId,
              submitter: s.createdBy,
              versionId: s.formVersionId,
            };
          });
          this.submissionTable = tableRows;
        }
      } catch (error) {
        // Handled in state fetchSubmissions
      } finally {
        this.loading = false;
      }
    },
  },
  mounted() {
    this.fetchForm(this.formId);
    this.populateSubmissionsTable();
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
