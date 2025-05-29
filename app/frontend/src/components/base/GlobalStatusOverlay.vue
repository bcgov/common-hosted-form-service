<template>
  <div v-if="showOverlay" class="status-overlay">
    <div class="status-content">
      <div class="status-header">
        {{ viteTitle }}
      </div>
      <p class="chefs-unavailable-message">
        {{ t('trans.statusOverlay.chefsUnavailableBoilerplate') }}
      </p>
      <h2>{{ statusMessage }}</h2>
      <div v-if="status?.connections">
        <strong>{{ t('trans.statusOverlay.connections') }}:</strong>
        <table class="status-connections-table">
          <thead>
            <tr>
              <th>{{ t('trans.statusOverlay.name') }}</th>
              <th>{{ t('trans.statusOverlay.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(conn, name) in status.connections" :key="name">
              <td>{{ conn.displayName }}</td>
              <td>
                <span :style="{ color: conn.connected ? 'green' : 'red' }">
                  {{
                    conn.connected
                      ? t('trans.statusOverlay.connected')
                      : t('trans.statusOverlay.disconnected')
                  }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="contact">
        {{ t('trans.statusOverlay.contact') }}: {{ contact }}
      </p>
      <div v-if="msTeamsUrl || rocketChatUrl" class="status-links">
        <span v-if="msTeamsUrl">
          <a :href="msTeamsUrl" target="_blank" rel="noopener">
            {{ t('trans.statusOverlay.msTeamsChannel') }}
          </a>
        </span>
        <span v-if="rocketChatUrl" style="margin-left: 1em">
          <a :href="rocketChatUrl" target="_blank" rel="noopener">
            {{ t('trans.statusOverlay.rocketChatChannel') }}
          </a>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { appAxios } from '~/services/interceptors';

const { t } = useI18n({ useScope: 'global' });

const props = defineProps({ parentReady: Boolean });

const showOverlay = ref(false);
const status = ref({});
const statusMessage = ref('');
const contact = ref('');

// Get VITE_TITLE from environment variables
const viteTitle = import.meta.env.VITE_TITLE || t('app.title');
const msTeamsUrl = import.meta.env.VITE_MSTEAMS_URL || '';
const rocketChatUrl = import.meta.env.VITE_ROCKETCHAT_URL || '';

let intervalId;

const defaultStatusMessage = t('trans.statusOverlay.defaultStatusMessage');

function setStatusOverlay(data, errorMsg = null) {
  // Handles both status objects and error data
  let msg = '';
  let contactInfo = '';

  if (data && typeof data === 'object') {
    if (data.stopped) {
      msg = t('trans.statusOverlay.shuttingDown');
    } else if (!data.ready) {
      msg = t('trans.statusOverlay.notReady');
    } else if (errorMsg) {
      msg = errorMsg;
    }
    contactInfo = data.contact || '';
    status.value = data;
  } else {
    msg = errorMsg || defaultStatusMessage;
    status.value = {};
  }

  showOverlay.value = !!msg;
  statusMessage.value = msg;
  contact.value = contactInfo;
}

function handleServiceUnavailable(event) {
  const errorData = event.detail;
  setStatusOverlay(errorData, defaultStatusMessage);
}

async function pollStatus() {
  if (!props.parentReady) {
    return;
  }
  try {
    const { data } = await appAxios().get('/status');
    setStatusOverlay(data);
  } catch (e) {
    setStatusOverlay(e.message, t('trans.statusOverlay.unableToReachBackend'));
  }
}

onMounted(() => {
  pollStatus();
  intervalId = setInterval(pollStatus, 10 * 1000); // Poll every 10 seconds
  window.addEventListener('service-unavailable', handleServiceUnavailable);
});

onUnmounted(() => {
  clearInterval(intervalId);
  window.removeEventListener('service-unavailable', handleServiceUnavailable);
});
</script>
