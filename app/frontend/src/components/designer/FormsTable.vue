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
      item-key="confirmationId"
      :items="submissions"
      :search="search"
      :loading="loading"
      loading-text="Loading... Please wait"
      :options="options"
    >
      <template v-slot:item.download="{ item }">
        <GeneratePdfButton :formName="formName" :submissionId="item.submissionId">
          <v-btn color="textLink" :data-test="`btn-pdf-${item.confirmationId}`" text small>
            <v-icon class="mr-1">picture_as_pdf</v-icon>
            <span>PDF</span>
          </v-btn>
        </GeneratePdfButton>
      </template>
      <template v-slot:item.details="{ item }">
        <router-link :to="{ path: `admin/submission/${item.submissionId}` }">
          <v-btn color="textLink" :data-test="`btn-view-${item.confirmationId}`" text small>
            <v-icon class="mr-1">remove_red_eye</v-icon>
            <span>VIEW</span>
          </v-btn>
        </router-link>
      </template>
    </v-data-table>
  </div>
</template>

<script>
// import commonFormService from '@/services/commonFormService';

export default {
  name: 'FormsTable',
  data() {
    return {
      headers: [
        { text: 'Form Title', align: 'start', value: 'title' },
        { text: 'Form Link', align: 'start', value: 'assignedTo' },
        { text: 'Version', align: 'start', value: 'name' },
        { text: 'Keyword', align: 'start', value: 'confirmationId' },
        { text: 'Status', align: 'start', value: 'confirmationId' },
      ],
    };
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
