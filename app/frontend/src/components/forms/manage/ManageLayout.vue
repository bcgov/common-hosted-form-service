<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ManageForm from '~/components/forms/manage/ManageForm.vue';
import ManageFormActions from '~/components/forms/manage/ManageFormActions.vue';
import { useNotificationStore } from '~/store/notification';
import { useFormStore } from '~/store/form';
import { FormPermissions } from '~/utils/constants';

const { locale, t } = useI18n({ useScope: 'global' });

const properties = defineProps({
  f: {
    type: String,
    required: true,
  },
});

const loading = ref(true);

const notificationStore = useNotificationStore();

const { form, permissions, isRTL } = storeToRefs(useFormStore());

onMounted(async () => {
  loading.value = true;

  const formStore = useFormStore();

  await formStore.fetchForm(properties.f);

  if (formStore.form.versions) {
    await formStore.getFormPermissionsForUser(properties.f);
  } else {
    notificationStore.addNotification({
      text: t('trans.baseSecure.401UnAuthorizedErrMsg'),
    });
  }

  if (permissions.value.includes(FormPermissions.DESIGN_READ))
    await formStore.fetchDrafts(properties.f);

  loading.value = false;
});
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <div
      class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
    >
      <!-- page title -->
      <div>
        <h1 :lang="locale">{{ $t('trans.manageLayout.manageForm') }}</h1>
        <h3>{{ form.name }}</h3>
      </div>
      <!-- buttons -->
      <div>
        <v-skeleton-loader :loading="loading" type="actions" class="bgtrans">
          <ManageFormActions />
        </v-skeleton-loader>
      </div>
    </div>
    <v-row no-gutters>
      <v-col cols="12" order="2">
        <v-skeleton-loader
          :loading="loading"
          type="list-item-two-line"
          class="bgtrans"
        >
          <ManageForm />
        </v-skeleton-loader>
      </v-col>
    </v-row>
  </div>
</template>

<style lang="scss" scoped>
.v-skeleton-loader {
  display: inline;
}
</style>
