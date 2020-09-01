<template>
  <div>
    <!-- table alert -->
    <v-alert v-if="alertShow" :type="alertType" tile dense>{{ alertMessage }}</v-alert>

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
      :items="submissions"
      :search="search"
      :loading="loading"
      loading-text="Loading... Please wait"
    >
      <template v-slot:item.actions>
        <v-btn color="textLink" text small>
          <router-link :to="{ name: 'FormSubmissions' }">
            <v-icon class="mr-1">remove_red_eye</v-icon>
            <span>VIEW</span>
          </router-link>
        </v-btn>
      </template>
    </v-data-table>
  </div>
</template>

<script>
export default {
  name: 'SubmissionsTable',
  data() {
    return {
      alertMessage: '',
      alertShow: false,
      alertType: null,
      headers: [
        { text: 'Confirmation ID', align: 'start', value: 'confirmationId' },
        { text: 'Submission Date', align: 'start', value: 'date' },
        { text: 'Submitter', align: 'start', value: 'submitter' },
        { text: 'Assigned To', align: 'start', value: 'asignee' },
        {
          text: 'Actions',
          align: 'end',
          value: 'actions',
          filterable: false,
          sortable: false,
        },
      ],
      submissions: [],
      loading: true,
      search: '',
    };
  },
  methods: {
    async populateSubmissionsTable() {
      try {
        const submissions = [
          { confirmationId: '2F6A9B2', date: 'August 1, 2020', submitter: 'Sarah Smith', asignee: 'Tim' },
          { confirmationId: 'ABC1234', date: 'July 21, 2020', submitter: 'Levar Smith', asignee: 'Jason' },
          { confirmationId: '98711BB', date: 'July 11, 2020', submitter: 'Joe Smith', asignee: 'Tim' },
        ];
        if (!submissions.length) {
          this.showTableAlert('info', 'No Submissions found for this form');
        }
        this.submissions = submissions;
      } catch (error) {
        console.error(`Error getting submissions: ${error}`); // eslint-disable-line no-console
        this.showTableAlert('error', 'Error getting submissions');
      } finally {
        this.loading = false;
      }
    },
    showTableAlert(typ, msg) {
      this.alertShow = true;
      this.alertType = typ;
      this.alertMessage = msg;
      this.loading = false;
    },
  },
  mounted() {
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
