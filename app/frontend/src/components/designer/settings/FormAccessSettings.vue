<script setup>
import { storeToRefs } from 'pinia';
import { computed, onBeforeMount, nextTick, ref } from 'vue';

import { IdentityMode } from '~/utils/constants';
import { useFormStore } from '~/store/form';
import { useIdpStore } from '~/store/identityProviders';
import { i18n } from '~/internationalization';

/* c8 ignore start */
const loginRequiredRules = ref([
  (v) => {
    return (
      v !== 'login' ||
      form.value.idps.length > 0 ||
      i18n.t('trans.formSettings.selectLoginType')
    );
  },
]);
/* c8 ignore stop */

const idpType = ref(null);

const idpStore = useIdpStore();

const { form, isRTL, lang } = storeToRefs(useFormStore());
const { loginButtons } = storeToRefs(idpStore);

const ID_MODE = computed(() => IdentityMode);

onBeforeMount(() => {
  if (form?.value?.idps && form?.value?.idps.length) {
    idpType.value = form.value.idps[0];
  }
});

function userTypeChanged() {
  // if they checked enable drafts then went back to public, uncheck it
  if (form.value.userType === ID_MODE.value.PUBLIC) {
    form.value = {
      ...form.value,
      enableSubmitterDraft: false,
      enableCopyExistingSubmission: false,
    };
  }
  if (form.value.userType !== 'team') {
    form.value = {
      ...form.value,
      reminder_enabled: false,
    };
  }
}

function updateLoginType() {
  // Unable to detect nested radio group in the form.idps for validation and there's no way
  // to manually enforce a validation rules check. So when we detect a change in the
  // idpType, we set the form idps ourselves and then change the userType twice
  // to re-validate the radio group that is the parent.
  form.value.idps = [idpType.value];
  form.value.userType = 'team';
  nextTick(() => {
    form.value.userType = 'login';
  });
}

defineExpose({ idpType, userTypeChanged, updateLoginType });
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="lang">{{
        $t('trans.formSettings.formAccess')
      }}</span></template
    >
    <v-radio-group
      ref="formAccess"
      v-model="form.userType"
      class="my-0"
      :mandatory="false"
      :rules="loginRequiredRules"
      @update:model-value="userTypeChanged"
    >
      <v-radio
        class="mb-4"
        :class="{ 'dir-rtl': isRTL }"
        :value="ID_MODE.PUBLIC"
      >
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.formSettings.public') }}
          </span>
        </template>
      </v-radio>
      <v-expand-transition>
        <BaseInfoCard
          v-if="form.userType == ID_MODE.PUBLIC"
          class="mr-4 mb-3"
          :class="{ 'dir-rtl': isRTL }"
        >
          <h4 class="text-primary" :lang="lang">
            <v-icon color="primary" icon="mdi:mdi-information" />
            {{ $t('trans.formSettings.important') }}!
          </h4>
          <p class="mt-2 mb-0" :lang="lang">
            {{ $t('trans.formSettings.info') }}
            <a href="https://engage.gov.bc.ca/govtogetherbc/" target="_blank">
              govTogetherBC.
              <v-icon size="small" color="primary" icon="mdi:mdi-open-in-new" />
            </a>
          </p>
        </BaseInfoCard>
      </v-expand-transition>
      <v-radio class="mb-4" :value="ID_MODE.LOGIN">
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.formSettings.loginRequired') }}
          </span>
        </template>
      </v-radio>
      <v-expand-transition>
        <v-row v-if="form.userType === ID_MODE.LOGIN" class="pl-6">
          <v-radio-group
            v-model="idpType"
            class="my-0"
            @update:model-value="updateLoginType"
          >
            <v-radio
              v-for="button in loginButtons"
              :key="button.code"
              :value="button.code"
              class="mx-2"
            >
              <template #label>
                <span :class="{ 'mr-2': isRTL }"> {{ button.display }} </span>
              </template>
            </v-radio>
            <!-- Mandatory BCeID process notification -->
            <v-expand-transition>
              <BaseInfoCard
                v-if="idpStore.hasFormAccessSettings(idpType, 'idim')"
                class="mr-4"
                :class="{ 'dir-rtl': isRTL }"
              >
                <h4 class="text-primary" :lang="lang">
                  <v-icon color="primary" icon="mdi:mdi-information" />
                  {{ $t('trans.formSettings.important') }}!
                </h4>
                <p class="my-2" :lang="lang">
                  {{ $t('trans.formSettings.idimNotifyA') }} (<a
                    href="mailto:IDIM.Consulting@gov.bc.ca"
                    >IDIM.Consulting@gov.bc.ca</a
                  >) {{ $t('trans.formSettings.idimNotifyB') }}
                </p>
                <p class="mt-2 mb-0" :lang="lang">
                  {{ $t('trans.formSettings.referenceGuideA') }}
                  <a
                    href="https://github.com/bcgov/common-hosted-form-service/wiki/Accessing-forms#Notify-the-idim-team-if-you-are-using-bceid"
                    :hreflang="lang"
                    >{{ $t('trans.formSettings.referenceGuideB') }}</a
                  >
                  {{ $t('trans.formSettings.referenceGuideC') }}.
                </p>
              </BaseInfoCard>
            </v-expand-transition>
          </v-radio-group>
        </v-row>
      </v-expand-transition>
      <v-radio :value="ID_MODE.TEAM">
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.formSettings.specificTeamMembers') }}
          </span>
        </template>
      </v-radio>
    </v-radio-group>
  </BasePanel>
</template>
