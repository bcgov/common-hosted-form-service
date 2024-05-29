<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { ref } from 'vue';

import { useFormStore } from '~/store/form';
import { FormPermissions } from '~/utils/constants';

const loading = ref(false);
const showConfirmationDialog = ref(false);
const showDeleteDialog = ref(false);
const showSecret = ref(false);
const filesApiAccess = ref(false);

const formStore = useFormStore();

const { apiKey, form, permissions, isRTL, lang } = storeToRefs(formStore);

const canDeleteKey = computed(() => {
  return (
    permissions.value.includes(FormPermissions.FORM_API_DELETE) && apiKey.value
  );
});

const canGenerateKey = computed(() => {
  return permissions.value.includes(FormPermissions.FORM_API_CREATE);
});

const canReadSecret = computed(() => {
  return (
    permissions.value.includes(FormPermissions.FORM_API_READ) && apiKey.value
  );
});

const secret = computed(() =>
  apiKey.value?.secret ? apiKey.value.secret : ''
);

if (canGenerateKey.value) {
  readKey();
}

async function createKey() {
  loading.value = true;
  await formStore.generateApiKey(form.value.id);
  showSecret.value = false;
  loading.value = false;
  showConfirmationDialog.value = false;
}

async function deleteKey() {
  loading.value = true;
  await formStore.deleteApiKey(form.value.id);
  filesApiAccess.value = false;
  loading.value = false;
  showDeleteDialog.value = false;
}

async function readKey() {
  loading.value = true;
  await formStore.readApiKey(form.value.id);
  filesApiAccess.value = apiKey.value?.filesApiAccess;
  loading.value = false;
}

async function updateKey() {
  loading.value = true;
  await formStore.filesApiKeyAccess(form.value.id, filesApiAccess.value);
  loading.value = false;
}

defineExpose({
  canDeleteKey,
  canGenerateKey,
  canReadSecret,
  createKey,
  deleteKey,
  readKey,
});
</script>

/* c8 ignore start */
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
      <li :lang="lang">
        {{ $t('trans.apiKey.infoD') }}
      </li>
    </ul>

    <v-skeleton-loader :loading="loading" type="button" class="bgtrans">
      <v-row class="mt-5">
        <v-col cols="12" sm="4" lg="3" xl="2">
          <v-btn
            block
            color="primary"
            :disabled="!canGenerateKey"
            :title="`${
              apiKey
                ? $t('trans.apiKey.regenerate')
                : $t('trans.apiKey.generate')
            }${$t('trans.apiKey.apiKey')}`"
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
                :title="
                  showSecret
                    ? $t('trans.apiKey.hideSecret')
                    : $t('trans.apiKey.showSecret')
                "
                @click="showSecret = !showSecret"
              />
            </template>
            <span :lang="lang">{{
              showSecret
                ? $t('trans.apiKey.hideSecret')
                : $t('trans.apiKey.showSecret')
            }}</span>
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
                :title="$t('trans.apiKey.deleteKey')"
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
  <v-row>
    <v-col>
      <v-checkbox
        v-model="filesApiAccess"
        :disabled="!apiKey"
        :label="$t('trans.apiKey.filesAPIAccess')"
        @update:model-value="updateKey"
      ></v-checkbox>
    </v-col>
  </v-row>
</template>
/* c8 ignore end */
