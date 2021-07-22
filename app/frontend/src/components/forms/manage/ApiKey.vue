<template>
  <div>
    <h3 class="mt-3">Disclaimer?</h3>
    <ul>
      <li>Store secret correctly</li>
      <li>Don't give out API key</li>
      <li>Don't use api key for USER based access (only system)</li>
    </ul>

    <v-row class="mt-5">
      <v-col cols="12" sm="4" lg="3" xl="2">
        <v-btn
          block
          color="primary"
          :disabled="!canGenerateKey()"
          @click="createKey"
        >
          <span>Generate api key</span>
        </v-btn>
      </v-col>
      <v-col cols="12" sm="5" xl="3">
        <v-text-field
          dense
          flat
          outlined
          solid
          readonly
          hide-details
          disabled
          label="Secret"
          data-test="text-name"
          v-model="name"
        />
      </v-col>
      <v-col cols="12" sm="3">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              small
              icon
              color="primary"
              :disabled="!canGenerateKey()"
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>edit</v-icon>
            </v-btn>
          </template>
          <span>Show Key</span>
        </v-tooltip>

        <v-btn small icon color="primary" :disabled="!canGenerateKey()">
          <v-icon>edit</v-icon>
        </v-btn>

        <v-btn small icon color="primary" :disabled="!canDeleteKey()">
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
    canDeleteKey() {
      return false;
    },
    canGenerateKey() {
      return false;
    },
  },
};
</script>
