<!-- eslint-disable no-console -->
<script setup>
import { storeToRefs } from 'pinia';
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { IdentityMode } from '~/utils/constants';
import { useFormStore } from '~/store/form';
import { useIdpStore } from '~/store/identityProviders';

const { t, locale } = useI18n({ useScope: 'global' });

/* c8 ignore start */
const loginRequiredRules = ref([
  (v) => {
    return (
      v !== 'login' ||
      idpType.value.length > 0 ||
      t('trans.formSettings.selectLoginType')
    );
  },
]);
/* c8 ignore stop */

const idpType = ref([]);
const IdpTypeList = computed(() => {
  const items = [
    {
      id: ID_MODE.value.PUBLIC,
      text: t('trans.formSettings.public'),
    },
    {
      id: ID_MODE.value.LOGIN,
      text: t('trans.formSettings.loginRequired'),
    },
    {
      id: ID_MODE.value.TEAM,
      text: t('trans.formSettings.specificTeamMembers'),
    },
  ];
  // if we want it sorted...
  // return items.sort((a, b) => a.text.localeCompare(b.text));
  return items;
});
const userTypeRef = ref(null); // use this to trigger validation on the v-autocomplete

const idpStore = useIdpStore();

const { form, isRTL } = storeToRefs(useFormStore());
const { loginButtons } = storeToRefs(idpStore);

const ID_MODE = computed(() => IdentityMode);

onBeforeMount(() => {
  idpType.value = form?.value?.idps || [];
});

watch(idpType, (val) => {
  form.value.idps = val;
  if (userTypeRef.value) {
    userTypeRef.value.validate();
  }
});

const hasFormAccessSettings = computed(() => {
  if (!idpType.value) {
    return false;
  }
  return idpType?.value.some((type) => {
    return idpStore.hasFormAccessSettings(type, 'idim');
  });
});

function userTypeChanged() {
  // if they checked enable drafts then went back to public, uncheck it
  if (form.value.userType === ID_MODE.value.PUBLIC) {
    form.value = {
      ...form.value,
      enableSubmitterDraft: false,
      enableCopyExistingSubmission: false,
      allowSubmitterToUploadFile: false,
      enableSubmitterRevision: false,
      enableTeamMemberDraftShare: false,
    };
  }
  if (form.value.userType !== 'team') {
    form.value = {
      ...form.value,
      reminder_enabled: false,
    };
  }
}

defineExpose({ idpType, userTypeChanged, IdpTypeList });
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="locale">{{
        $t('trans.formSettings.formAccess')
      }}</span></template
    >
    <v-autocomplete
      ref="userTypeRef"
      v-model="form.userType"
      :class="{ label: isRTL }"
      :items="IdpTypeList"
      :rules="loginRequiredRules"
      item-title="text"
      item-value="id"
      data-test="userType"
      @update:model-value="userTypeChanged"
    ></v-autocomplete>
    <div>
      <v-expand-transition>
        <BaseInfoCard
          v-if="form.userType == ID_MODE.PUBLIC"
          class="mr-4 mb-3"
          :class="{ 'dir-rtl': isRTL }"
        >
          <h4 class="text-primary" :lang="locale">
            <v-icon color="primary" icon="mdi:mdi-information" />
            {{ $t('trans.formSettings.important') }}!
          </h4>
          <p class="mt-2 mb-0" :lang="locale">
            {{ $t('trans.formSettings.info') }}
            <a href="https://engage.gov.bc.ca/govtogetherbc/" target="_blank">
              govTogetherBC.
              <v-icon size="small" color="primary" icon="mdi:mdi-open-in-new" />
            </a>
          </p>
        </BaseInfoCard>
      </v-expand-transition>
      <v-expand-transition>
        <div v-if="form.userType === ID_MODE.LOGIN" class="pl-6">
          <div>
            <v-checkbox
              v-for="btn in loginButtons"
              :key="btn.code"
              v-model="idpType"
              :label="btn.display"
              :value="btn.code"
              class="my-0"
              hide-details="auto"
              :data-test="`idpType-${btn.hint}`"
              :class="{ 'dir-rtl': isRTL }"
            />
          </div>
          <!-- Mandatory BCeID process notification -->
          <v-expand-transition>
            <BaseInfoCard
              v-if="hasFormAccessSettings"
              class="mr-4"
              :class="{ 'dir-rtl': isRTL }"
            >
              <h4 class="text-primary" :lang="locale">
                <v-icon color="primary" icon="mdi:mdi-information" />
                {{ $t('trans.formSettings.important') }}!
              </h4>
              <p class="my-2" :lang="locale">
                <span
                  :lang="locale"
                  v-html="$t('trans.formSettings.idimNotifyA')"
                ></span
                >&nbsp;(<a href="mailto:IDIM.Consulting@gov.bc.ca"
                  >IDIM.Consulting@gov.bc.ca</a
                >) {{ $t('trans.formSettings.idimNotifyB') }}
              </p>
              <p class="mt-2 mb-0" :lang="locale">
                {{ $t('trans.formSettings.referenceGuideA') }}
                <a
                  href="https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Form-Management/Accessing-forms/#to-use-log-in-required-with-bceid"
                  :lang="locale"
                  >{{ $t('trans.formSettings.referenceGuideB') }}</a
                >
                {{ $t('trans.formSettings.referenceGuideC') }}.
              </p>
            </BaseInfoCard>
          </v-expand-transition>
        </div>
      </v-expand-transition>
      <v-expand-transition>
        <BaseInfoCard
          v-if="form.userType == ID_MODE.TEAM"
          class="mr-4 mb-3"
          :class="{ 'dir-rtl': isRTL }"
        >
          <p class="mt-2 mb-0" :lang="locale">
            {{ $t('trans.formSettings.teamMemberTooltip')
            }}<v-icon icon="mdi:mdi-account-multiple" />
          </p>
        </BaseInfoCard>
      </v-expand-transition>
    </div>
  </BasePanel>
</template>
