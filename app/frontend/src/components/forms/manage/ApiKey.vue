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
    ...mapState(useFormStore, [
      'apiKey',
      'form',
      'permissions',
      'isRTL',
      'lang',
    ]),
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
      return this.apiKey?.secret ? this.apiKey.secret : '';
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
  <div :class="{ 'dir-rtl': isRTL }">
    <div v-if="!canGenerateKey" class="mt-3 mb-6">
      <v-icon class="mr-1" color="primary" icon="mdi:mdi-information"></v-icon>
      <span :lang="lang" v-html="$t('trans.apiKey.formOwnerKeyAcess')"></span>
    </div>
    <h3 class="mt-3" :lang="lang">
      {{ $t('trans.apiKey.disclaimer') }}
    </h3>
    <ul :class="isRTL ? 'mr-6' : null">
      <li :lang="lang">{{ $t('trans.apiKey.infoA') }}</li>
      <li :lang="lang">
        {{ $t('trans.apiKey.infoB') }}
      </li>
      <li :lang="lang">
        {{ $t('trans.apiKey.infoC') }}
      </li>
    </ul>

    <v-skeleton-loader :loading="loading" type="button" class="bgtrans">
      <v-row class="mt-5">
        <v-col cols="12" sm="4" lg="3" xl="2">
          <v-btn
            block
            color="primary"
            :disabled="!canGenerateKey"
            @click="showConfirmationDialog = true"
          >
            <span :lang="lang"
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
            :type="showSecret ? 'text' : 'password'"
            :model-value="secret"
            :lang="lang"
          />
        </v-col>
        <v-col cols="12" sm="3">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="primary"
                :disabled="!canReadSecret"
                v-bind="props"
                size="x-small"
                density="default"
                :icon="showSecret ? 'mdi:mdi-eye-off' : 'mdi:mdi-eye'"
                @click="showHideKey"
              />
            </template>
            <span v-if="showSecret" :lang="lang">{{
              $t('trans.apiKey.hideSecret')
            }}</span>
            <span v-else :lang="lang">{{ $t('trans.apiKey.showSecret') }}</span>
          </v-tooltip>

          <BaseCopyToClipboard
            :disabled="!canReadSecret || !showSecret"
            class="mx-2"
            :text-to-copy="secret"
            :snack-bar-text="$t('trans.apiKey.sCTC')"
            :tooltip-text="$t('trans.apiKey.cSTC')"
            :lang="lang"
          />

          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="red"
                :disabled="!canDeleteKey"
                v-bind="props"
                size="x-small"
                density="default"
                icon="mdi:mdi-delete"
                @click="showDeleteDialog = true"
              />
            </template>
            <span :lang="lang">{{ $t('trans.apiKey.deleteKey') }}</span>
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
      <template #title
        ><span :lang="lang">
          {{ $t('trans.apiKey.confirmKeyGen') }}
        </span></template
      >
      <template #text>
        <span
          v-if="!apiKey"
          :lang="lang"
          v-html="$t('trans.apiKey.createAPIKey')"
        />
        <span
          v-else
          :lang="lang"
          v-html="$t('trans.apiKey.regenerateAPIKey')"
        />
      </template>
      <template #button-text-continue>
        <span :lang="lang"
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
      <template #title
        ><span :lang="lang"
          >{{ $t('trans.apiKey.confirmDeletion') }}
        </span></template
      >
      <template #text
        ><span :lang="lang">{{ $t('trans.apiKey.deleteMsg') }}</span></template
      >
      <template #button-text-continue>
        <span :lang="lang">{{ $t('trans.apiKey.delete') }}</span>
      </template>
    </BaseDialog>
  </div>
</template>
