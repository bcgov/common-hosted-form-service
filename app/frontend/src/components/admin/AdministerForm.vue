<template>
  <v-skeleton-loader :loading="loading" type="article">
    <h3>{{ form.name }}</h3>
    <p>{{ form.description }}</p>

    <div v-if="form.active === false" class="red--text mb-6">
      ({{ $t('trans.administerForm.deleted') }})
      <v-btn
        color="primary"
        class="mt-0"
        @click="showRestoreDialog = true"
        text
        small
      >
        <v-icon class="mr-1">build_circle</v-icon>
        <span class="d-none d-sm-flex">{{
          $t('trans.administerForm.restoreForm')
        }}</span>
      </v-btn>
    </div>

    <v-container>
      <v-row no-gutters>
        <v-col md="6">
          <h4>{{ $t('trans.administerForm.formDetails') }}</h4>
          <vue-json-pretty :data="formDetails" />

          <div v-if="apiKey" class="mt-6">
            <h4>{{ $t('trans.administerForm.apiKeyDetails') }}</h4>
            <vue-json-pretty :data="apiKey" />
            <v-btn
              class="mt-6 mb-6"
              color="primary"
              :disabled="!apiKey"
              @click="showDeleteDialog = true"
            >
              <span>{{ $t('trans.administerForm.deleteApiKey') }}</span>
            </v-btn>
          </div>
        </v-col>
        <v-col md="6">
          <h4>{{ $t('trans.administerForm.formUsers') }}</h4>
          <vue-json-pretty :data="roles" />
        </v-col>
      </v-row>
    </v-container>

    <div v-if="form.active" class="mt-12">
      <h4>{{ $t('trans.administerForm.formVersions') }}</h4>
      <AdminVersions />
    </div>

    <div v-if="form.active" class="mt-12">
      <h4>{{ $t('trans.administerForm.assignANewOwner') }}</h4>
      <AddOwner :formId="form.id" />
    </div>

    <BaseDialog
      v-model="showRestoreDialog"
      type="CONTINUE"
      @close-dialog="showRestoreDialog = false"
      @continue-dialog="restore"
    >
      <template #title>{{
        $t('trans.administerForm.confirmRestore')
      }}</template>
      <template #text>
        <div v-if="restoreInProgress" class="text-center">
          <v-progress-circular indeterminate color="primary" :size="100">
            {{ $t('trans.administerForm.restoring') }}
          </v-progress-circular>
        </div>
        <div v-else>
          {{ $t('trans.administerForm.restore') }}
          <strong>{{ form.name }}</strong>
          {{ $t('trans.administerForm.toActiveState') }}?
        </div>
      </template>
      <template #button-text-continue>
        <span>{{ $t('trans.administerForm.restore') }}</span>
      </template>
    </BaseDialog>

    <!-- Delete confirmation -->
    <BaseDialog
      v-model="showDeleteDialog"
      type="CONTINUE"
      @close-dialog="showDeleteDialog = false"
      @continue-dialog="deleteKey"
    >
      <template #title>{{
        $t('trans.administerForm.confirmDeletion')
      }}</template>
      <template #text>{{
        $t('trans.administerForm.confirmDeletionMsg')
      }}</template>
      <template #button-text-continue>
        <span>{{ $t('trans.administerForm.delete') }}</span>
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
