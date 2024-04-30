<script setup>
import { storeToRefs } from 'pinia';
import { computed, onBeforeMount, provide, ref } from 'vue';

import ManageForm from '~/components/forms/manage/ManageForm.vue';
import ManageFormActions from '~/components/forms/manage/ManageFormActions.vue';
import { AppPermissions, FormPermissions } from '~/utils/constants';
import { useFormStore } from '~/store/form';

const properties = defineProps({
  f: {
    type: String,
    required: true,
  },
  d: {
    type: String,
    required: true,
  },
  fd: {
    type: Boolean,
  },
});

provide('formDesigner', JSON.parse(properties.fd));
provide('draftId', properties.d);
provide('formId', properties.f);

const loading = ref(true);
const showManageForm = ref(false);

const formStore = useFormStore();
const { permissions, form, lang } = storeToRefs(formStore);

const APP_PERMS = computed(() => AppPermissions);

onBeforeMount(async () => {
  loading.value = true;

  await formStore.fetchForm(properties.f);
  await formStore.getFormPermissionsForUser(properties.f);
  if (permissions.value.includes(FormPermissions.DESIGN_READ)) {
    await formStore
      .fetchDrafts(properties.f)
      .then(() => (showManageForm.value = true));
  }

  loading.value = false;
});
</script>

<template>
  <BaseSecure :permission="APP_PERMS.VIEWS_FORM_STEPPER">
    <v-stepper
      :model-value="2"
      hide-actions
      alt-labels
      flat
      tile
      :border="false"
    >
      <v-stepper-header>
        <v-stepper-item
          :title="$t('trans.baseStepper.setUpForm')"
          value="1"
          :complete="true"
        />
        <v-divider />
        <v-stepper-item
          :title="$t('trans.baseStepper.designForm')"
          value="2"
          :complete="true"
        />
        <v-divider />
        <v-stepper-item :title="$t('trans.baseStepper.manageForm')" value="3" />
      </v-stepper-header>
      <v-stepper-window>
        <v-stepper-window-item value="3">
          <div
            class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
          >
            <!-- page title -->
            <div>
              <h1 :lang="lang">{{ $t('trans.manageLayout.manageForm') }}</h1>
              <h3>{{ form.name }}</h3>
            </div>
            <div>
              <ManageFormActions />
            </div>
          </div>
          <v-row no-gutters>
            <v-col cols="12" order="2">
              <v-skeleton-loader
                :loading="loading"
                type="list-item-two-line"
                class="bgtrans"
              >
                <ManageForm v-if="showManageForm" />
              </v-skeleton-loader>
            </v-col>
          </v-row>
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>
  </BaseSecure>
</template>
