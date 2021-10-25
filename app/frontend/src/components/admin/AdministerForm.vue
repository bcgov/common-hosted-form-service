<template>
  <div>
    <h3>{{ form.name }}</h3>
    <p>{{ form.description }}</p>

    <div v-if="form.active === false" class="red--text mb-6">
      (DELETED)
      <v-btn color="primary" class="mt-0" @click="showRestoreDialog = true" text small>
        <v-icon class="mr-1">build_circle</v-icon>
        <span class="d-none d-sm-flex">Restore this form</span>
      </v-btn>
    </div>

    <v-container>
      <v-row no-gutters>
        <v-col cols="6">
          <h4>Form Details</h4>
          <vue-json-pretty :data="formDetails" />
        </v-col>

        <v-col cols="6">
          <div v-if="apiKey">
            <h4>API Key Details</h4>
            <vue-json-pretty :data="apiKey" />
            <v-btn class="mt-6" color="primary" :disabled="!apiKey" @click="showDeleteDialog = true">
              <span>Delete API Key</span>
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <div v-if="form.active">
      <h4>Form Versions</h4>
      <AdminVersions />
    </div>

    <BaseDialog
      v-model="showRestoreDialog"
      type="CONTINUE"
      @close-dialog="showRestoreDialog = false"
      @continue-dialog="restore"
    >
      <template #title>Confirm Restore</template>
      <template #text>
        <div v-if="restoreInProgress" class="text-center">
          <v-progress-circular indeterminate color="primary" :size="100">Restoring</v-progress-circular>
        </div>
        <div v-else>
          Restore
          <strong>{{ form.name }}</strong> to active state?
        </div>
      </template>
      <template #button-text-continue>
        <span>Restore</span>
      </template>
    </BaseDialog>
    <!-- Delete confirmation -->
    <BaseDialog
      v-model="showDeleteDialog"
      type="CONTINUE"
      @close-dialog="showDeleteDialog = false"
      @continue-dialog="deleteKey"
    >
      <template #title>Confirm Deletion</template>
      <template #text>Are you sure you want to delete this API Key?</template>
      <template #button-text-continue>
        <span>Delete</span>
      </template>
    </BaseDialog>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import AdminVersions from './AdminVersions.vue';

import VueJsonPretty from 'vue-json-pretty';

export default {
  name: 'AdministerForm',
  components: {
    AdminVersions,
    VueJsonPretty
  },
  props: {
    formId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      showRestoreDialog: false,
      restoreInProgress: false,
      showDeleteDialog: false,
      formDetails: {},
    };
  },
  computed: {
    ...mapGetters('admin', ['form', 'apiKey']),
  },
  methods: {
    ...mapActions('admin', [
      'deleteApiKey',
      'readApiDetails',
      'readForm',
      'restoreForm',
    ]),
    async deleteKey() {
      await this.deleteApiKey(this.form.id);
      this.showDeleteDialog = false;
    },
    async restore() {
      this.restoreInProgress = true;
      await this.restoreForm(this.form.id);
      this.restoreInProgress = false;
      this.showRestoreDialog = false;
    },
  },
  async mounted() {
    await Promise.all([
      this.readForm(this.formId),
      this.readApiDetails(this.formId)
    ]);

    this.formDetails = this.form;
    delete this.formDetails.versions;
  },
};
</script>
