<script setup>
import { ref, onMounted } from 'vue';
import { i18n } from '~/internationalization';
import { useFormStore } from '~/store/form';
import userService from '~/services/userService';
import { useNotificationStore } from '~/store/notification';

const formStore = useFormStore();
const notificationStore = useNotificationStore();
const items = ref([]);
const loading = ref(true);

const form = formStore.form;

onMounted(async () => {
  try {
    loading.value = true;
    const result = await userService.getUserLabels();
    items.value = result.data;
  } catch (error) {
    notificationStore.addNotification({
      text: i18n.t('trans.formProfile.getLabelErr'),
      consoleError: i18n.t('trans.formProfile.getLabelConsErr') + `${error}`,
    });
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="d-flex">
    <v-combobox
      v-model="form.labels"
      :items="items"
      chips
      clearable
      :label="$t('trans.formProfile.label')"
      :loading="loading"
      multiple
      variant="solo-filled"
      closable-chips
    >
    </v-combobox>
    <div class="mt-3 text-h6">
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-icon
            color="primary"
            class="ml-4"
            :class="{ 'mr-2': isRTL }"
            v-bind="props"
            icon="mdi:mdi-help-circle-outline"
          />
        </template>
        <span>
          <span :lang="lang"
            >Labels serve as a means to categorize similar forms that may belong
            to a common organization or share a related context.</span
          >
        </span>
      </v-tooltip>
    </div>
  </div>
</template>
