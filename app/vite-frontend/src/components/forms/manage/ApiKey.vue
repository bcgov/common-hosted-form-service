<script>
import { mapActions, mapState } from 'pinia';

import BaseCopyToClipboard from '~/components/base/BaseCopyToClipboard.vue';
import BaseDialog from '~/components/base/BaseDialog.vue';
import { useFormStore } from '~/store/form';
import { FormPermissions } from '~/utils/constants';

export default {
  components: {
    BaseCopyToClipboard,
    BaseDialog,
  },
  data() {
    return {
      loading: false,
      showConfirmationDialog: false,
      showDeleteDialog: false,
      showSecret: false,
    };
  },
  computed: {
    ...mapState(useFormStore, ['apiKey', 'form', 'permissions']),
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
      return this.apiKey?.secret ? this.apiKey.secret : undefined;
    },
  },
  created() {
    if (this.canGenerateKey) {
      this.readKey();
    }
  },
  methods: {
    ...mapActions(useFormStore, [
      'deleteApiKey',
      'generateApiKey',
      'readApiKey',
    ]),
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

<template>
  <div>
    <div v-if="!canGenerateKey" class="mt-3 mb-6">
      <v-icon class="mr-1" color="primary" icon="mdi:mdi-information"></v-icon>
      <span v-html="$t('trans.apiKey.formOwnerKeyAcess')"></span>
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
            density="compact"
            hide-details
            :label="$t('trans.apiKey.secret')"
            variant="outlined"
            solid
            readonly
            :type="
              showSecret ? $t('trans.apiKey.text') : $t('trans.apiKey.password')
            "
            :model-value="secret"
          />
        </v-col>
        <v-col cols="12" sm="3">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="primary"
                :disabled="!canReadSecret"
                icon
                size="small"
                v-bind="props"
                @click="showHideKey"
              >
                <v-icon v-if="showSecret" icon="mdi:mdi-eye-off"></v-icon>
                <v-icon v-else icon="mdi:mdi-eye"></v-icon>
              </v-btn>
            </template>
            <span v-if="showSecret">{{ $t('trans.apiKey.hideSecret') }}</span>
            <span v-else>{{ $t('trans.apiKey.showSecret') }}</span>
          </v-tooltip>

          <BaseCopyToClipboard
            :disabled="!canReadSecret || !showSecret"
            class="ml-2"
            :text-to-copy="secret"
            :snack-bar-text="$t('trans.apiKey.sCTC')"
            :tooltip-text="$t('trans.apiKey.cSTC')"
          />

          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="red"
                :disabled="!canDeleteKey"
                icon
                size="small"
                v-bind="props"
                @click="showDeleteDialog = true"
              >
                <v-icon icon="mdi:mdi-delete"></v-icon>
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
