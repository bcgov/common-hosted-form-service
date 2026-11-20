<script>
let scriptLoad;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptLoad) {
    scriptLoad = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      function failLoad() {
        clearTimeout(timer);
        script.remove();
        reject(new Error('Unable to load Turnstile'));
      }
      const timer = setTimeout(failLoad, 15000);
      script.onerror = failLoad;
      script.onload = () => {
        if (!window.turnstile) {
          failLoad();
          return;
        }
        clearTimeout(timer);
        resolve(window.turnstile);
      };
      document.head.appendChild(script);
    }).catch((error) => {
      scriptLoad = undefined;
      throw error;
    });
  }
  return scriptLoad;
}
</script>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import { turnstileService } from '~/services';
import { useFormStore } from '~/store/form';
import { TURNSTILE_PROTECTED_IDPS } from '~/utils/constants';

const props = defineProps({
  formId: { type: String, required: true },
  submissionId: { type: String, default: undefined },
  allowOffline: Boolean,
  recheck: Boolean,
});

const emit = defineEmits(['verified', 'cancel']);
const { locale } = useI18n({ useScope: 'global' });
const route = useRoute();
const formStore = useFormStore();
const state = ref('loading');
const container = ref(null);
let api;
let widget;
let disposed = false;

function removeWidget() {
  if (widget !== undefined) api.remove(widget);
  widget = undefined;
}

function fail() {
  if (disposed) return;
  removeWidget();
  state.value = 'error';
}

function allowAccess() {
  state.value = 'verified';
  emit('verified');
}

async function verify(token) {
  if (disposed || state.value !== 'challenge') return;
  state.value = 'verifying';
  try {
    await turnstileService.verifyChallenge(
      props.formId,
      token,
      props.submissionId,
      props.recheck
    );
    // Confirm the browser accepted the proof cookie before opening the form.
    const { data } = await turnstileService.readStatus(
      props.formId,
      props.submissionId,
      props.recheck
    );
    if (!data.verified) throw new Error('Turnstile proof cookie missing');
    if (disposed) return;
    removeWidget();
    allowAccess();
  } catch {
    fail();
  }
}

async function start() {
  state.value = 'loading';
  try {
    if (
      props.allowOffline &&
      !navigator.onLine &&
      (route.query.editOffline || route.query.fresh)
    ) {
      const providers = formStore.getCachedFormSchema(props.formId)?.form
        ?.identityProviders;
      if (
        providers?.length &&
        providers.every(
          ({ code }) => code && !TURNSTILE_PROTECTED_IDPS.includes(code)
        )
      ) {
        allowAccess();
        return;
      }
    }

    const { data } = await turnstileService.readStatus(
      props.formId,
      props.submissionId,
      props.recheck
    );
    if (disposed) return;
    if (data.verified) {
      allowAccess();
      return;
    }
    api = await loadTurnstile();
    if (disposed) return;
    state.value = 'challenge';
    await nextTick();
    if (disposed) return;
    widget = api.render(container.value, {
      sitekey: data.siteKey,
      action: 'chefs_submit',
      cData: props.formId.toLowerCase(),
      callback: verify,
      'error-callback': fail,
      'expired-callback': fail,
      'timeout-callback': fail,
      'response-field': false,
      size: 'flexible',
    });
  } catch {
    fail();
  }
}

onMounted(start);
onBeforeUnmount(() => {
  disposed = true;
  removeWidget();
});
</script>

<template>
  <slot v-if="state === 'verified'" />
  <v-card
    v-else
    :class="[{ 'dir-rtl': formStore.isRTL }, { 'mx-auto my-6': !recheck }]"
    :variant="recheck ? 'elevated' : 'outlined'"
    :max-width="recheck ? undefined : 560"
    :lang="locale"
  >
    <v-card-title
      :id="recheck ? 'submission-verification-title' : undefined"
      :tag="recheck ? 'h2' : 'h1'"
      class="text-wrap pt-5 px-6"
    >
      {{
        $t(
          recheck
            ? 'trans.formSubmissionGate.recheckTitle'
            : 'trans.formSubmissionGate.title'
        )
      }}
    </v-card-title>
    <v-card-text class="px-6 pb-5">
      <p class="mb-4">
        {{
          $t(
            recheck
              ? 'trans.formSubmissionGate.recheckInstructions'
              : 'trans.formSubmissionGate.instructions'
          )
        }}
      </p>
      <div
        v-if="state === 'challenge' || state === 'verifying'"
        ref="container"
        class="turnstile-widget"
      />
      <div
        v-if="state === 'loading' || state === 'verifying'"
        class="d-flex align-center ga-3"
        role="status"
      >
        <v-progress-circular indeterminate color="primary" size="20" />
        <span>{{ $t('trans.formSubmissionGate.loading') }}</span>
      </div>
      <v-alert
        v-if="state === 'error'"
        role="alert"
        type="warning"
        variant="tonal"
      >
        {{ $t('trans.formSubmissionGate.error') }}
      </v-alert>
    </v-card-text>
    <v-card-actions
      v-if="state === 'error' || recheck"
      class="justify-end px-6 pb-5"
    >
      <v-btn
        v-if="state === 'error'"
        color="primary"
        variant="flat"
        rounded="lg"
        @click="start"
      >
        {{ $t('trans.formSubmissionGate.retry') }}
      </v-btn>
      <v-btn
        v-if="recheck"
        color="primary"
        variant="outlined"
        rounded="lg"
        @click="emit('cancel')"
      >
        {{ $t('trans.formSubmissionGate.cancel') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.turnstile-widget {
  max-width: 400px;
}
</style>
