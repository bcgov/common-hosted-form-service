<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';

import ManageForm from '~/components/forms/manage/ManageForm.vue';
import { useFormStore } from '~/store/form';
import { FormPermissions } from '~/utils/constants';

const formStore = useFormStore();

const { form, permissions } = storeToRefs(formStore);

const props = defineProps({
  f: {
    type: String,
    required: true,
  },
});

const loading = ref(true);

onMounted(async () => {
  loading.value = true;

  await Promise.all([
    formStore.fetchForm(props.f),
    formStore.getFormPermissionsForUser(props.f),
  ]);

  if (permissions.value.includes(FormPermissions.DESIGN_READ))
    await formStore.fetchDrafts(props.f);

  loading.value = false;
});
</script>

<template>
  <div>
    <v-row class="mt-6" no-gutters>
      <!-- page title -->
      <v-col cols="12" sm="6" order="2" order-sm="1">
        <h1>Manage Form</h1>
      </v-col>
      <!-- form name -->
      <v-col cols="12" order="3">
        <h3>{{ form.name }}</h3>
      </v-col>
    </v-row>
    <v-skeleton-loader :loading="loading" type="list-item-two-line">
      <ManageForm />
    </v-skeleton-loader>
  </div>
</template>
