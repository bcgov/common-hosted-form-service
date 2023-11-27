<script setup>
import { ref, computed, onMounted } from 'vue';
import { i18n } from '~/internationalization';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';
import userService from '~/services/userService';
import { useNotificationStore } from '~/store/notification';

const formStore = useFormStore();
const notificationStore = useNotificationStore();
const items = ref([]);
const loading = ref(true);

const form = computed(() => formStore.form);
const lang = computed(() => formStore.lang);

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

const remove = (item) => {
  formStore.form.labels.value.splice(
    formStore.form.labels.value.indexOf(item),
    1
  );
};
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="lang">{{ $t('trans.formProfile.tags') }}</span></template
    >
    <v-combobox
      v-model="form.labels"
      :items="items"
      chips
      clearable
      :label="$t('trans.formProfile.tags')"
      :loading="loading"
      multiple
      variant="solo"
    >
      <template #selection="{ attrs, item, select, selected }">
        <v-chip
          v-bind="attrs"
          :model-value="selected"
          closable
          @click="select"
          @click:close="remove(item)"
        >
          <strong>{{ item }}</strong
          >&nbsp;
          <span>(interest)</span>
        </v-chip>
      </template>
    </v-combobox>
  </BasePanel>
</template>
