<template>
  <v-skeleton-loader :loading="loading" type="article">
    <h3>{{ form.name }}</h3>
    <p>{{ form.description }}</p>

    <div v-if="form.active === false" class="red--text mb-6">
      (DELETED)
      <v-btn
        color="primary"
        class="mt-0"
        @click="showRestoreDialog = true"
        text
        small
      >
        <v-icon class="mr-1">build_circle</v-icon>
        <span class="d-none d-sm-flex">Restore this form</span>
      </v-btn>
    </div>

    <v-container>
      <v-row no-gutters>
        <v-col md="6">
          <h4>Form Details</h4>
          <vue-json-pretty :data="formDetails" />

          <div v-if="apiKey" class="mt-6">
            <h4>API Key Details</h4>
            <vue-json-pretty :data="apiKey" />
            <v-btn
              class="mt-6 mb-6"
              color="primary"
              :disabled="!apiKey"
              @click="showDeleteDialog = true"
            >
              <span>Delete API Key</span>
            </v-btn>
          </div>
        </v-col>
        <v-col md="6">
          <h4>Form Users</h4>
          <vue-json-pretty :data="roles" />
        </v-col>
      </v-row>
    </v-container>

    <div v-if="form.active" class="mt-12">
      <h4>Form Versions</h4>
      <AdminVersions />
    </div>

    <div v-if="form.active" class="mt-12">
      <h4>Assign A New Owner</h4>
      <AddOwner :formId="form.id"/>
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
          <v-progress-circular indeterminate color="primary" :size="100">
            Restoring
          </v-progress-circular>
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
  </v-skeleton-loader>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import AddOwner from './AddOwner.vue';
import AdminVersions from './AdminVersions.vue';

import VueJsonPretty from 'vue-json-pretty';

export default {
  name: 'AdministerForm',
  components: {
    AddOwner,
    AdminVersions,
    VueJsonPretty,
  },
  props: {
    formId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      formDetails: {},
      loading: true,
      restoreInProgress: false,
      roleDetails: {},
      showDeleteDialog: false,
      showRestoreDialog: false,
    };
  },
  computed: {
    ...mapGetters('admin', ['form', 'roles', 'apiKey']),
  },
  methods: {
    ...mapActions('admin', [
      'deleteApiKey',
      'readApiDetails',
      'readForm',
      'readRoles',
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
      this.readApiDetails(this.formId),
      this.readRoles(this.formId),
    ]);

    this.formDetails = { ...this.form };
    delete this.formDetails.versions;

    this.loading = false;
  },
};
</script>
