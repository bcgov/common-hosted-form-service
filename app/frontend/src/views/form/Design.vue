<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';

import FormDesigner from '~/components/designer/FormDesigner.vue';
import { useFormStore } from '~/store/form';
import { AppPermissions } from '~/utils/constants';

defineProps({
  d: {
    type: String,
    default: null,
  },
  f: {
    type: String,
    default: null,
  },
  sv: Boolean,
  v: {
    type: String,
    default: null,
  },
  svs: {
    type: String,
    default: null,
  },
  nv: {
    type: Boolean,
    default: false,
  },
});

const formStore = useFormStore();

const { form } = storeToRefs(formStore);

const formDesigner = ref(null);

const APP_PERMS = computed(() => AppPermissions);

onMounted(async () => {
  await formStore.listFCProactiveHelp();
});

onBeforeRouteLeave((_to, _from, next) => {
  form.value.isDirty
    ? next(
        window.confirm(
          'Do you really want to leave this page? Changes you made will not be saved.'
        )
      )
    : next();
});
</script>

<template>
  <BaseSecure :permission="APP_PERMS.VIEWS_FORM_STEPPER">
    <v-stepper
      :model-value="1"
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
        <v-stepper-item :title="$t('trans.baseStepper.designForm')" value="2" />
        <v-divider />
        <v-stepper-item :title="$t('trans.baseStepper.manageForm')" value="3" />
      </v-stepper-header>
      <v-stepper-window>
        <v-stepper-window-item value="2">
          <FormDesigner
            ref="formDesigner"
            class="mt-6"
            :draft-id="d"
            :form-id="f"
            :saved="JSON.parse(sv)"
            :version-id="v"
            :is-saved-status="svs"
            :new-version="nv"
          />
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>
  </BaseSecure>
</template>
