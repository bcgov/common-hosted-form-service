<template>
  <div>
    <div v-if="!canGenerateKey" class="mt-3 mb-6">
      <v-icon class="mr-1" color="primary">info</v-icon
      ><span v-html="$t('trans.apiKey.formOwnerKeyAcess')"></span>
    </div>
    <h3 class="mt-3">{{ $t('trans.apiKey.disclaimer') }}</h3>
    <ul>
      <li>{{ $t('trans.apiKey.infoA') }}</li>
      <li>
        {{ $t('trans.apiKey.infoB') }}
      </li>
      <li>
        {{ $t('trans.apiKey.infoC') }}
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
            <span
              >{{
                apiKey
                  ? $t('trans.apiKey.regenerate')
                  : $t('trans.apiKey.generate')
              }}
              {{ $t('trans.apiKey.apiKey') }}</span
            >
          </v-btn>
        </v-col>
        <v-col cols="12" sm="5" xl="3">
          <v-text-field
            dense
            flat
            hide-details
            :label="$t('trans.apiKey.secret')"
            outlined
            solid
            readonly
            :type="
              showSecret ? $t('trans.apiKey.text') : $t('trans.apiKey.password')
            "
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
            <span v-if="showSecret">{{ $t('trans.apiKey.hideSecret') }}</span>
            <span v-else>{{ $t('trans.apiKey.showSecret') }}</span>
          </v-tooltip>

          <BaseCopyToClipboard
            :disabled="!canReadSecret || !showSecret"
            class="ml-2"
            :copyText="secret"
            :snackBarText="$t('trans.apiKey.sCTC')"
            tooltipText="$t('trans.apiKey.cSTC')"
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
            <span>{{ $t('trans.apiKey.deleteKey') }}</span>
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
      <template #title>{{ $t('trans.apiKey.confirmKeyGen') }}</template>
      <template #text>
        <span v-if="!apiKey" v-html="$t('trans.apiKey.createAPIKey')"> </span>
        <span v-else v-html="$t('trans.apiKey.regenerateAPIKey')"> </span>
      </template>
      <template #button-text-continue>
        <span
          >{{
            apiKey ? $t('trans.apiKey.regenerate') : $t('trans.apiKey.generate')
          }}
          {{ $t('trans.apiKey.key') }}</span
        >
      </template>
    </BaseDialog>

    <!-- Delete confirmation -->
    <BaseDialog
      v-model="showDeleteDialog"
      type="CONTINUE"
      @close-dialog="showDeleteDialog = false"
      @continue-dialog="deleteKey"
    >
      <template #title>{{ $t('trans.apiKey.confirmDeletion') }}</template>
      <template #text>{{ $t('trans.apiKey.deleteMsg') }}</template>
      <template #button-text-continue>
        <span>{{ $t('trans.apiKey.delete') }}</span>
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
  created() {
    if (this.canGenerateKey) {
      this.readKey();
    }
  },
};
</script>
