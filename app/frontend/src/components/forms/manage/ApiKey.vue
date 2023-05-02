<template>
  <div>
    <div v-if="!canGenerateKey" class="mt-3 mb-6">
      <v-icon class="mr-1" color="primary">info</v-icon> You must be the
      <strong>Form Owner</strong> to manage API Keys.
    </div>
    <h3 class="mt-3">Disclaimer</h3>
    <ul>
      <li>
        Ensure that your API key secret is stored in a secure location (i.e. key
        vault).
      </li>
      <li>
        Your API key grants unrestricted access to your form. Do not give out
        your API key to anyone.
      </li>
      <li>
        The API key should ONLY be used for automated system interactions. Do
        not use your API key for user based access.
      </li>
    </ul>

    <v-skeleton-loader :loading="loading" type="button">
      <v-row class="mt-5">
        <v-col cols="12" sm="4" lg="3" xl="2">
          <v-btn
            block
            color="primary"
            :disabled="!canGenerateKey"
            @click="showConfirmationDialog = true"
          >
            <span>{{ apiKey ? 'Regenerate' : 'Generate' }} api key</span>
          </v-btn>
        </v-col>
        <v-col cols="12" sm="5" xl="3">
          <v-text-field
            dense
            flat
            hide-details
            label="Secret"
            outlined
            solid
            readonly
            :type="showSecret ? 'text' : 'password'"
            :value="secret"
          />
        </v-col>
        <v-col cols="12" sm="3">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                color="primary"
                :disabled="!canReadSecret"
                icon
                small
                v-bind="attrs"
                v-on="on"
                @click="showHideKey"
              >
                <v-icon v-if="showSecret">visibility_off</v-icon>
                <v-icon v-else>visibility</v-icon>
              </v-btn>
            </template>
            <span v-if="showSecret">Hide Secret</span>
            <span v-else>Show Secret</span>
          </v-tooltip>

          <BaseCopyToClipboard
            :disabled="!canReadSecret || !showSecret"
            class="ml-2"
            :copy-text="secret"
            snack-bar-text="Secret copied to clipboard"
            tooltip-text="Copy secret to clipboard"
          />

          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                color="red"
                :disabled="!canDeleteKey"
                icon
                small
                v-bind="attrs"
                v-on="on"
                @click="showDeleteDialog = true"
              >
                <v-icon>delete</v-icon>
              </v-btn>
            </template>
            <span>Delete Key</span>
          </v-tooltip>
        </v-col>
      </v-row>
    </v-skeleton-loader>

    <!-- Generate/regen confirmation -->
    <BaseDialog
      v-model="showConfirmationDialog"
      type="CONTINUE"
      @close-dialog="showConfirmationDialog = false"
      @continue-dialog="createKey"
    >
      <template #title>Confirm Key Generation</template>
      <template #text>
        <span v-if="!apiKey">
          Create an API Key for this form?<br />
          Ensure you follow the Disclaimer on this page.
        </span>
        <span v-else>
          Regenerate the API Key? <br />
          <strong>Continuing will delete your current API Key access</strong>.
        </span>
      </template>
      <template #button-text-continue>
        <span>{{ apiKey ? 'Regenerate' : 'Generate' }} Key</span>
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
      <template #text>Are you sure you wish to delete your API Key?</template>
      <template #button-text-continue>
        <span>Delete</span>
      </template>
    </BaseDialog>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { FormPermissions } from '@/utils/constants';

export default {
  name: 'ApiKey',
  data() {
    return {
      loading: false,
      showConfirmationDialog: false,
      showDeleteDialog: false,
      showSecret: false,
    };
  },
  computed: {
    ...mapGetters('form', ['apiKey', 'form', 'permissions']),
    canDeleteKey() {
      return (
        this.permissions.includes(FormPermissions.FORM_API_DELETE) &&
        this.apiKey
      );
    },
    canGenerateKey() {
      return this.permissions.includes(FormPermissions.FORM_API_CREATE);
    },
    canReadSecret() {
      return (
        this.permissions.includes(FormPermissions.FORM_API_READ) && this.apiKey
      );
    },
    secret() {
      return this.apiKey && this.apiKey.secret ? this.apiKey.secret : undefined;
    },
  },
  created() {
    if (this.canGenerateKey) {
      this.readKey();
    }
  },
  methods: {
    ...mapActions('form', ['deleteApiKey', 'generateApiKey', 'readApiKey']),
    async createKey() {
      this.loading = true;
      await this.generateApiKey(this.form.id);
      this.showSecret = false;
      this.loading = false;
      this.showConfirmationDialog = false;
    },
    async deleteKey() {
      this.loading = true;
      await this.deleteApiKey(this.form.id);
      this.loading = false;
      this.showDeleteDialog = false;
    },
    async readKey() {
      this.loading = true;
      await this.readApiKey(this.form.id);
      this.loading = false;
    },
    showHideKey() {
      this.showSecret = !this.showSecret;
    },
  },
};
</script>
