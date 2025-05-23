<template>
  <div v-if="showOverlay" class="status-overlay">
    <div class="status-content">
      <h2>{{ statusMessage }}</h2>
      <pre>{{ statusDetails }}</pre>
      <div v-if="status?.connections">
        <strong>Connections:</strong>
        <ul>
          <li v-for="(conn, name) in status.connections" :key="name">
            {{ name }}:
            <span :style="{ color: conn.connected ? 'green' : 'red' }">{{
              conn.connected ? 'Connected' : 'Disconnected'
            }}</span>
          </li>
        </ul>
      </div>
      <p v-if="contact">Contact: {{ contact }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { appAxios } from '~/services/interceptors';

const props = defineProps({ parentReady: Boolean });

const showOverlay = ref(false);
const status = ref({});
const statusMessage = ref('');
const statusDetails = ref('');
const contact = ref('');

let intervalId;

async function pollStatus() {
  if (!props.parentReady) {
    return;
  }
  try {
    const { data } = await appAxios().get('/status');
    status.value = data;
    if (data.stopped) {
      showOverlay.value = true;
      statusMessage.value = 'The service is shutting down.';
    } else if (!data.ready) {
      showOverlay.value = true;
      statusMessage.value = 'The service is not ready.';
    } else {
      showOverlay.value = false;
    }
    statusDetails.value = JSON.stringify(data, null, 2);
    contact.value = data.contact || '';
  } catch (e) {
    showOverlay.value = true;
    statusMessage.value = 'Unable to reach backend service.';
    statusDetails.value = e.message;
  }
}

onMounted(() => {
  pollStatus();
  intervalId = setInterval(pollStatus, 5000); // Poll every 5 seconds
});

onUnmounted(() => {
  clearInterval(intervalId);
});
</script>

<style scoped>
.status-overlay {
  position: fixed;
  z-index: 9999;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: all;
}
.status-content {
  background: #fff;
  border: 2px solid #d32f2f;
  padding: 2em;
  border-radius: 8px;
  box-shadow: 0 0 20px #d32f2f55;
  text-align: center;
  max-width: 90vw;
  max-height: 80vh;
  overflow: auto;
}
</style>
