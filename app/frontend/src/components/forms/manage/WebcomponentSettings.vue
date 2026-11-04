<script setup>
import { storeToRefs } from 'pinia';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { webcomponentSettingsService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { IdentityMode, NotificationTypes } from '~/utils/constants';

const MAX_ALLOWED_ORIGINS = 20;
const MAX_ORIGIN_LENGTH = 255;
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

const props = defineProps({
  // Whether the panel holding the settings is open; they load when it first opens
  active: { type: Boolean, default: true },
});

const { t, locale } = useI18n({ useScope: 'global' });

const allowedOrigins = ref([]);
// The origins as last loaded or saved, to tell whether there is anything to save
const savedOrigins = ref([]);
const newOrigin = ref('');
const originTouched = ref(false);
const originInput = ref(null);
const saveButton = ref(null);
const loading = ref(true);
let loadStarted = false;
// Saving after a failed load would replace the saved origins with an incomplete list
const loadFailed = ref(false);
const saving = ref(false);

const notificationStore = useNotificationStore();
const { form, isRTL } = storeToRefs(useFormStore());

const isPublicForm = computed(
  () => form.value?.userType === IdentityMode.PUBLIC
);
const atLimit = computed(
  () => allowedOrigins.value.length >= MAX_ALLOWED_ORIGINS
);
const hasChanges = computed(
  () =>
    newOrigin.value.trim() !== '' ||
    allowedOrigins.value.join('\n') !== savedOrigins.value.join('\n')
);

// Same rules as the API: an https origin, or http on localhost, with no path, query or wildcard
function normalizeOrigin(value) {
  if (value.length > MAX_ORIGIN_LENGTH) return null;
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  const secure =
    url.protocol === 'https:' ||
    (url.protocol === 'http:' && LOCAL_HOSTNAMES.has(url.hostname));
  const bare =
    !url.username &&
    !url.password &&
    url.pathname === '/' &&
    !url.search &&
    !url.hash &&
    !url.hostname.includes('*');
  // An international domain name gets longer once converted, so check the result too
  return secure && bare && url.origin.length <= MAX_ORIGIN_LENGTH
    ? url.origin
    : null;
}

const originError = computed(() => {
  if (!newOrigin.value) return '';
  const origin = normalizeOrigin(newOrigin.value);
  if (!origin) return t('trans.webcomponentSettings.invalidOrigin');
  if (allowedOrigins.value.includes(origin)) {
    return t('trans.webcomponentSettings.duplicateOrigin');
  }
  return '';
});

// Show the error once the user leaves the field or tries to add, not while typing
const shownOriginError = computed(() =>
  originTouched.value ? originError.value : ''
);

// Keep keyboard focus in the panel after the button that had it is disabled or removed.
// At the limit the field is disabled too, so focus moves to Save.
async function keepFocus() {
  await nextTick();
  if (atLimit.value) saveButton.value?.$el?.focus();
  else originInput.value?.focus();
}

function addOrigin() {
  originTouched.value = true;
  const origin = normalizeOrigin(newOrigin.value);
  if (!origin || originError.value || atLimit.value) return false;
  allowedOrigins.value = [...allowedOrigins.value, origin];
  newOrigin.value = '';
  originTouched.value = false;
  keepFocus();
  return true;
}

function removeOrigin(origin) {
  allowedOrigins.value = allowedOrigins.value.filter((o) => o !== origin);
  keepFocus();
}

// The panel stays mounted while collapsed to keep unsaved edits, so load only once it opens
watch(
  () => props.active,
  async (active) => {
    if (!active || loadStarted) return;
    loadStarted = true;
    await fetchSettings();
    loading.value = false;
  },
  { immediate: true }
);

async function fetchSettings() {
  try {
    const response = await webcomponentSettingsService.readWebcomponentSettings(
      form.value.id
    );
    allowedOrigins.value = response.data?.allowedOrigins || [];
    savedOrigins.value = [...allowedOrigins.value];
    loadFailed.value = false;
  } catch (e) {
    loadFailed.value = true;
    notificationStore.addNotification({
      text: t('trans.webcomponentSettings.fetchError'),
      consoleError: `${t('trans.webcomponentSettings.fetchError')}: ${
        e.message
      }`,
    });
  }
}

async function handleSave() {
  // An unfinished or failed load would replace the saved origins with an incomplete list
  if (loading.value || loadFailed.value) return;
  // An origin left in the field is saved too; text that is not a valid origin stops the save
  if (newOrigin.value.trim() && !addOrigin()) return;

  saving.value = true;
  try {
    const response =
      await webcomponentSettingsService.upsertWebcomponentSettings(
        form.value.id,
        { allowedOrigins: allowedOrigins.value }
      );
    allowedOrigins.value = response.data?.allowedOrigins || [];
    savedOrigins.value = [...allowedOrigins.value];
    notificationStore.addNotification({
      text: t('trans.webcomponentSettings.saveSuccess'),
      ...NotificationTypes.SUCCESS,
    });
  } catch (e) {
    // The API names the entries it refused
    const refused = [
      ...(e.response?.data?.invalidOrigins || []),
      ...(e.response?.data?.duplicateOrigins || []),
    ];
    const text = refused.length
      ? `${t('trans.webcomponentSettings.saveError')}: ${refused.join(', ')}`
      : t('trans.webcomponentSettings.saveError');
    notificationStore.addNotification({
      text,
      consoleError: `${t('trans.webcomponentSettings.saveError')}: ${
        e.message
      }`,
    });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <div class="mb-4" :lang="locale">
      {{ $t('trans.webcomponentSettings.description') }}
    </div>

    <v-alert
      v-if="!isPublicForm"
      type="info"
      variant="tonal"
      class="mb-4"
      :lang="locale"
      data-test="notPublicNotice"
    >
      {{ $t('trans.webcomponentSettings.notPublicNotice') }}
    </v-alert>

    <v-alert
      v-if="loadFailed"
      type="error"
      variant="tonal"
      class="mb-4"
      :lang="locale"
      data-test="loadFailed"
    >
      {{ $t('trans.webcomponentSettings.fetchError') }}
    </v-alert>

    <div class="font-weight-bold mb-2" :lang="locale">
      {{ $t('trans.webcomponentSettings.allowedOrigins') }}
    </div>

    <v-list
      v-if="allowedOrigins.length"
      density="compact"
      class="mb-2"
      data-test="originList"
    >
      <v-list-item
        v-for="origin in allowedOrigins"
        :key="origin"
        :title="origin"
      >
        <template #append>
          <v-btn
            icon="mdi:mdi-delete"
            size="small"
            variant="text"
            color="red"
            :title="$t('trans.webcomponentSettings.remove')"
            :aria-label="`${$t('trans.webcomponentSettings.remove')} ${origin}`"
            :data-test="`removeOrigin-${origin}`"
            @click="removeOrigin(origin)"
          />
        </template>
      </v-list-item>
    </v-list>
    <div v-else-if="!loading" class="text-medium-emphasis mb-2" :lang="locale">
      {{ $t('trans.webcomponentSettings.noOrigins') }}
    </div>

    <div class="d-flex align-start">
      <v-text-field
        ref="originInput"
        v-model="newOrigin"
        :label="$t('trans.webcomponentSettings.originLabel')"
        :hint="$t('trans.webcomponentSettings.originHint')"
        placeholder="https://www.example.com"
        :error-messages="shownOriginError"
        :disabled="atLimit || loadFailed || loading"
        :loading="loading"
        :maxlength="MAX_ORIGIN_LENGTH"
        persistent-hint
        variant="outlined"
        density="compact"
        :lang="locale"
        data-test="newOrigin"
        @blur="originTouched = true"
        @keydown.enter.prevent="addOrigin"
      />
      <v-btn
        :class="isRTL ? 'mr-2' : 'ml-2'"
        color="primary"
        variant="outlined"
        :disabled="
          !newOrigin || !!originError || atLimit || loadFailed || loading
        "
        :title="$t('trans.webcomponentSettings.add')"
        data-test="addOrigin"
        @click="addOrigin"
      >
        <span :lang="locale">{{ $t('trans.webcomponentSettings.add') }}</span>
      </v-btn>
    </div>
    <div v-if="atLimit" class="text-caption mt-1" :lang="locale">
      {{
        $t('trans.webcomponentSettings.maxOrigins', {
          max: MAX_ALLOWED_ORIGINS,
        })
      }}
    </div>

    <div class="mt-4">
      <v-btn
        ref="saveButton"
        color="primary"
        :loading="saving"
        :disabled="saving || loading || loadFailed || !hasChanges"
        :title="$t('trans.webcomponentSettings.save')"
        data-test="saveWebcomponentSettings"
        @click="handleSave"
      >
        <span v-if="!saving" :lang="locale">{{
          $t('trans.webcomponentSettings.save')
        }}</span>
        <span v-else :lang="locale">{{
          $t('trans.webcomponentSettings.saving')
        }}</span>
      </v-btn>
    </div>
  </div>
</template>
