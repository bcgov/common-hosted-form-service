<template>
  <div v-if="showOverlay" class="status-overlay">
    <!---->
    <div class="status-content">
      <div v-if="!showMore" class="status-header">
        <v-icon icon="mdi:mdi-alert-outline"></v-icon
        >{{ t('trans.statusOverlay.chefsUnavailableHeader') }}
      </div>
      <div v-else class="status-header">
        <v-icon icon="mdi:mdi-alert-outline"></v-icon>{{ msg }}
      </div>
      <div v-if="!showMore">
        <p class="chefs-unavailable-message">
          {{ t('trans.statusOverlay.chefsUnavailableBoilerplate') }}
        </p>
      </div>
      <div v-else>
        <div>
          <div v-if="status?.connections">
            <p class="moreinfo-intro">
              {{ t('trans.statusOverlay.moreInfoIntro') }}
            </p>
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
          <p class="moreinfo-outro">
            <i18n-t keypath="trans.statusOverlay.moreInfoOutro">
              <template #linkOne>
                <a :href="msTeamsUrl" target="_blank">{{
                  t('trans.statusOverlay.msTeamsChannel')
                }}</a>
              </template>
              <template #linkTwo>
                <a :href="rocketChatUrl" target="_blank">{{
                  t('trans.statusOverlay.rocketChatChannel')
                }}</a>
              </template>
            </i18n-t>
          </p>
        </div>
      </div>
      <div class="status-footer">
        <div class="info-links">
          <button data-test="more-info-button" @click="showMore = !showMore">
            {{
              showMore
                ? t('trans.statusOverlay.lessInfo')
                : t('trans.statusOverlay.moreInfo')
            }}
          </button>
        </div>
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
const showMore = ref(false);
const msg = ref('');

// Get VITE_TITLE from environment variables
//const viteTitle = import.meta.env.VITE_TITLE || t('app.title');
const msTeamsUrl = import.meta.env.VITE_MSTEAMS_URL || '';
const rocketChatUrl = import.meta.env.VITE_ROCKETCHAT_URL || '';

let intervalId;

const defaultStatusMessage = t('trans.statusOverlay.defaultStatusMessage');

function setStatusOverlay(data, errorMsg = null) {
  // Handles both status objects and error data
  msg.value = '';

  if (data && typeof data === 'object') {
    if (data.stopped) {
      msg.value = t('trans.statusOverlay.shuttingDown');
    } else if (!data.ready) {
      msg.value = t('trans.statusOverlay.notReady');
    } else if (errorMsg) {
      msg.value = errorMsg;
    }
    status.value = data;
  } else {
    msg.value = errorMsg || defaultStatusMessage;
    status.value = {};
  }

  showOverlay.value = !!msg.value;
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
  intervalId = setInterval(pollStatus, 60 * 1000); // Poll every 10 seconds
  window.addEventListener('service-unavailable', handleServiceUnavailable);
});

onUnmounted(() => {
  clearInterval(intervalId);
  window.removeEventListener('service-unavailable', handleServiceUnavailable);
});
</script>
