<template>
  <div>
    <v-row no-gutters>
      <v-col cols="12" md="auto">
        <strong>Current Draft: </strong>
        <small>Last Updated: {{ draft.updatedAt | formatDate }}</small>
      </v-col>
      <v-col cols="12" md="4">
        <v-switch
          class="my-0 mx-md-10 pa-0"
          v-model="publishing"
          color="success"
          @change="publishThisVersion"
        >
          <template v-slot:label>
            {{ !publishing ? 'Unpublished' : 'Publishing' }}
            <v-progress-circular
              v-if="publishing"
              :indeterminate="publishing"
              :value="0"
              size="24"
              class="ml-2"
            ></v-progress-circular>
          </template>
        </v-switch>
      </v-col>

      <v-spacer></v-spacer>

      <v-col cols="12" md="auto">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <router-link
              :to="{ name: 'FormDesigner', query: { d: draft.id, f: form.id } }"
            >
              <v-btn class="mx-1" color="primary" icon v-bind="attrs" v-on="on">
                <v-icon>edit</v-icon>
              </v-btn>
            </router-link>
          </template>
          <span>Edit Current Draft</span>
        </v-tooltip>

        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              class="mx-1"
              color="red"
              @click="showDeleteDialog = true"
              :disabled="hasVersions"
              icon
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>delete</v-icon>
            </v-btn>
          </template>
          <span>Delete Current Draft</span>
        </v-tooltip>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  data() {
    return {
      publishing: false,
    };
  },
  computed: {
    ...mapGetters('form', ['drafts', 'form']),
    draft() {
      return this.drafts[0];
    },
    hasVersions() {
      return !this.form || !this.form.versions || !this.form.versions.length;
    },
  },
  methods: {
    ...mapActions('form', ['fetchForm', 'fetchDrafts', 'publishDraft']),
    async publishThisVersion() {
      await this.publishDraft({ formId: this.form.id, draftId: this.draft.id });
      // Refresh form version and drafts details
      this.fetchForm(this.form.id);
      this.fetchDrafts(this.form.id);
    },
  },
};
</script>
