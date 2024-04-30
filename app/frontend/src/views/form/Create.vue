<script setup>
import { storeToRefs } from 'pinia';
import { onBeforeRouteLeave } from 'vue-router';
import { computed, ref, watch } from 'vue';

import FormDesigner from '~/components/designer/FormDesigner.vue';
import FormDisclaimer from '~/components/designer/FormDisclaimer.vue';
import FormSettings from '~/components/designer/FormSettings.vue';
import FormProfile from '~/components/designer/FormProfile.vue';
import { i18n } from '~/internationalization';
import { useFormStore } from '~/store/form';
import { AppPermissions, IdentityMode } from '~/utils/constants';

const formDesigner = ref(null);
const settingsForm = ref(null);
const settingsFormValid = ref(false);
const step = ref(0);
const stepper = ref(null);
const disclaimerCheckbox = ref(false);
const disclaimerRules = [(v) => !!v || i18n.t('trans.create.agreementErrMsg')];

const formStore = useFormStore();

const { form, isRTL, lang } = storeToRefs(formStore);
const APP_PERMS = computed(() => AppPermissions);

watch(form, () => {
  if (form.userType === IdentityMode.LOGIN && settingsForm.value)
    settingsForm.value.validate();
});

onBeforeRouteLeave((_to, _from, next) => {
  form.value.isDirty
    ? next(window.confirm(i18n.t('trans.create.confirmPageNav')))
    : next();
});

formStore.resetForm();
</script>

<template>
  <BaseSecure :permission="APP_PERMS.VIEWS_FORM_STEPPER">
    <v-stepper
      ref="stepper"
      :model-value="step"
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
          :complete="step == 1"
        />
        <v-divider />
        <v-stepper-item
          :title="$t('trans.baseStepper.designForm')"
          value="2"
          :complete="step > 1"
        />
        <v-divider />
        <v-stepper-item
          :title="$t('trans.baseStepper.manageForm')"
          value="3"
          :complete="step > 2"
        />
      </v-stepper-header>
      <v-stepper-window>
        <v-stepper-window-item value="1">
          <v-form ref="settingsForm" v-model="settingsFormValid">
            <h1 :lang="lang">
              {{ $t('trans.create.formSettings') }}
            </h1>
            <FormSettings />

            <FormProfile />

            <BasePanel class="my-6">
              <template #title
                ><span :lang="lang">{{
                  $t('trans.create.disclaimer')
                }}</span></template
              >
              <FormDisclaimer />

              <v-checkbox
                v-model="disclaimerCheckbox"
                :rules="disclaimerRules"
                required="true"
              >
                <template #label>
                  <span :class="{ 'mr-2': isRTL }" :lang="lang">{{
                    $t('trans.create.disclaimerStmt')
                  }}</span>
                </template>
              </v-checkbox>
            </BasePanel>
          </v-form>
          <v-btn
            :disabled="!settingsFormValid"
            color="primary"
            data-test="continue-btn"
            @click="stepper.next()"
          >
            {{ $t('trans.create.continue') }}
          </v-btn>
        </v-stepper-window-item>
        <v-stepper-window-item value="2">
          <FormDesigner ref="formDesigner" />
          <v-btn
            variant="outlined"
            data-test="back-btn"
            @click="stepper.prev()"
          >
            <span :lang="lang">{{ $t('trans.create.back') }}</span>
          </v-btn>
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>
  </BaseSecure>
</template>
