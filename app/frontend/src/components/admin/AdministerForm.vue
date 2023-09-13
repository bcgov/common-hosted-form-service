<script>
import { mapActions, mapState } from 'pinia';
import VueJsonPretty from 'vue-json-pretty';

import AddOwner from '~/components/admin/AddOwner.vue';
import AdminVersions from '~/components/admin/AdminVersions.vue';
import BaseDialog from '~/components/base/BaseDialog.vue';
import { useAdminStore } from '~/store/admin';
import { useFormStore } from '~/store/form';

export default {
  components: {
    AddOwner,
    AdminVersions,
    BaseDialog,
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
      showDeleteDialog: false,
      showRestoreDialog: false,
    };
  },
  computed: {
    ...mapState(useAdminStore, ['form', 'roles', 'apiKey']),
    ...mapState(useFormStore, ['lang']),
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
  methods: {
    ...mapActions(useAdminStore, [
      'deleteApiKey',
      'readForm',
      'readApiDetails',
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
};
</script>

<template>
  <v-skeleton-loader :loading="loading" type="article" class="bgtrans">
    <h3>{{ form.name }}</h3>
    <p>{{ form.description }}</p>

    <div v-if="form.active === false" class="text-red mb-6" :lang="lang">
      ({{ $t('trans.administerForm.deleted') }})
      <v-btn
        color="primary"
        class="mt-0"
        variant="text"
        size="small"
        @click="showRestoreDialog = true"
      >
        <v-icon class="mr-1" icon="mdi:mdi-wrench"></v-icon>
        <span class="d-none d-sm-flex" :lang="lang">{{
          $t('trans.administerForm.restoreForm')
        }}</span>
      </v-btn>
    </div>

    <v-container>
      <v-row no-gutters>
        <v-col md="6">
          <h4 :lang="lang">
            {{ $t('trans.administerForm.formDetails') }}
          </h4>
          <vue-json-pretty :data="formDetails" />

          <div v-if="apiKey" class="mt-6">
            <h4 :lang="lang">
              {{ $t('trans.administerForm.apiKeyDetails') }}
            </h4>
            <vue-json-pretty :data="apiKey" />
            <v-btn
              class="mt-6 mb-6"
              color="primary"
              :disabled="!apiKey"
              @click="showDeleteDialog = true"
            >
              <span :lang="lang">{{
                $t('trans.administerForm.deleteApiKey')
              }}</span>
            </v-btn>
          </div>
        </v-col>
        <v-col md="6">
          <h4 :lang="lang">
            {{ $t('trans.administerForm.formUsers') }}
          </h4>
          <vue-json-pretty :data="roles" />
        </v-col>
      </v-row>
    </v-container>

    <div v-if="form.active" class="mt-12">
      <h4 :lang="lang">
        {{ $t('trans.administerForm.formVersions') }}
      </h4>
      <AdminVersions />
    </div>

    <div v-if="form.active" class="mt-12">
      <h4 :lang="lang">{{ $t('trans.administerForm.assignANewOwner') }}</h4>
      <AddOwner :form-id="form.id" />
    </div>

    <BaseDialog
      v-model="showRestoreDialog"
      type="CONTINUE"
      @close-dialog="showRestoreDialog = false"
      @continue-dialog="restore"
    >
      <template #title
        ><span :lang="lang">{{
          $t('trans.administerForm.confirmRestore')
        }}</span></template
      >
      <template #text>
        <div v-if="restoreInProgress" class="text-center">
          <v-progress-circular
            indeterminate
            color="primary"
            :size="100"
            :lang="lang"
          >
            {{ $t('trans.administerForm.restoring') }}
          </v-progress-circular>
        </div>
        <div v-else :lang="lang">
          {{ $t('trans.administerForm.restore') }}
          <strong>{{ form.name }}</strong>
          {{ $t('trans.administerForm.toActiveState') }}?
        </div>
      </template>
      <template #button-text-continue>
        <span :lang="lang">{{ $t('trans.administerForm.restore') }}</span>
      </template>
    </BaseDialog>

    <!-- Delete confirmation -->
    <BaseDialog
      v-model="showDeleteDialog"
      type="CONTINUE"
      @close-dialog="showDeleteDialog = false"
      @continue-dialog="deleteKey"
    >
      <template #title
        ><span :lang="lang">{{
          $t('trans.administerForm.confirmDeletion')
        }}</span></template
      >
      <template #text
        ><span :lang="lang">{{
          $t('trans.administerForm.confirmDeletionMsg')
        }}</span>
      </template>
      <template #button-text-continue
        ><span :lang="lang">{{ $t('trans.administerForm.delete') }}</span>
      </template>
    </BaseDialog>
  </v-skeleton-loader>
</template>
