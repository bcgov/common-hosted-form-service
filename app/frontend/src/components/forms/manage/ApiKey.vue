<template>
  <div>
    <h3 class="mt-3">Disclaimer?</h3>
    <ul>
      <li>Store secret correctly</li>
      <li>Don't give out API key</li>
      <li>Don't use api key for USER based access (only system)</li>
    </ul>

    <v-row class="my-5">
      <v-col cols="12" sm="6" md="3" lg="2">
        <v-btn block color="primary" @click="createKey">
          <span>Generate api key</span>
        </v-btn>
      </v-col>
      <v-col cols="12" sm="6" md="4" lg="3">
        <v-text-field
          dense
          flat
          outlined
          solid
          readonly
          label="Secret"
          data-test="text-name"
          v-model="name"
        />
      </v-col>
      <v-col cols="12" sm="12" md="3">
        <v-btn small icon color="primary">
          <v-icon>edit</v-icon>
        </v-btn>
        <v-btn small icon color="primary">
          <v-icon>edit</v-icon>
        </v-btn>
        <v-btn small icon color="primary">
          <v-icon>edit</v-icon>
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'ApiKey',
  data() {
    return {
      showSecret: false,
      showPublishDialog: false,
      showDeleteDraftDialog: false,
      rerenderTable: 0,
    };
  },
  computed: {
    ...mapGetters('form', ['form', 'permissions']),
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    ...mapActions('form', [
      'fetchForm',
      'fetchDrafts',
      'publishDraft',
      'deleteDraft',
      'toggleVersionPublish',
    ]),
  },
};
</script>

<style scoped>
/* Todo, this is duplicated in a few tables, extract to style */
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
