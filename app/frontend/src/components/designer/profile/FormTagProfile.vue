<script setup>
// import { ref, onMounted } from 'vue';
// import { i18n } from '~/internationalization';
// import { useFormStore } from '~/store/form';
// import userService from '~/services/userService';
// import { useNotificationStore } from '~/store/notification';

// const formStore = useFormStore();
// const notificationStore = useNotificationStore();
// const items = ref([]);
// const loading = ref(true);

// const form = formStore.form;

// onMounted(async () => {
//   try {
//     loading.value = true;
//     //const result = await userService.getUserLabels();
//     //items.value = result.data;
//   } catch (error) {
//     notificationStore.addNotification({
//       text: i18n.t('trans.formProfile.getLabelErr'),
//       consoleError: i18n.t('trans.formProfile.getLabelConsErr') + `${error}`,
//     });
//   } finally {
//     loading.value = false;
//   }
// });
</script>

<template>
  <v-combobox
    :items="['items']"
    chips
    clearable
    :label="$t('trans.formProfile.label')"
    multiple
    variant="solo"
    closable-chips
  >
  </v-combobox>
</template>
