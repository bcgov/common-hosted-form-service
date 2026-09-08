<!-- eslint-disable no-console -->
<script setup>
import { storeToRefs } from 'pinia';
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  IdentityMode,
  DeprecatedIDPs,
  RestrictedIDPs,
} from '~/utils/constants';
import { useFormStore } from '~/store/form';
import { useIdpStore } from '~/store/identityProviders';
import { useTenantStore } from '~/store/tenant';

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
  const tenantStore = useTenantStore();
  const isEnterprise = !!tenantStore.selectedTenant;

  // if we want it sorted...
  // return items.sort((a, b) => a.text.localeCompare(b.text));
  return [
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
      // Enterprise CHEFS: group-based access via CSTAR
      text: isEnterprise
        ? t('trans.formSettings.specificGroups')
        : t('trans.formSettings.specificTeamMembers'),
    },
  ];
});
const userTypeRef = ref(null); // use this to trigger validation on the v-autocomplete

const idpStore = useIdpStore();

const { form, isRTL } = storeToRefs(useFormStore());
const { formAccessButtons } = storeToRefs(idpStore);

const showDeprecatedIdpDialog = ref(false);
const pendingDeprecatedIdp = ref(null);

function cancelDeprecatedIdpRemoval() {
  pendingDeprecatedIdp.value = null;
  showDeprecatedIdpDialog.value = false;
}

function confirmDeprecatedIdpRemoval() {
  const code = pendingDeprecatedIdp.value?.code;
  idpType.value = idpType.value.filter((idp) => idp !== code);
  filteredIDPs.value = filteredIDPs.value.filter((idp) => idp.code !== code);
  pendingDeprecatedIdp.value = null;
  showDeprecatedIdpDialog.value = false;
}

const deprecatedIDPs = Object.values(DeprecatedIDPs);
const restrictedIDPs = Object.values(RestrictedIDPs);

const filteredIDPs = ref(
  formAccessButtons.value
    .filter(
      (idp) =>
        !deprecatedIDPs.includes(idp.code) || form.value.idps.includes(idp.code)
    )
    .map((idp) => ({
      ...idp,
      restricted: restrictedIDPs.includes(idp.code),
      deprecated: deprecatedIDPs.includes(idp.code),
    }))
);
function onIdpToggle(idp, checked) {
  const isSelected = idpType.value.includes(idp.code);
  const shouldBeChecked = checked === true;

  if (idp.deprecated && isSelected && !shouldBeChecked) {
    pendingDeprecatedIdp.value = idp;
    showDeprecatedIdpDialog.value = true;
    return;
  }

  if (shouldBeChecked && !isSelected) {
    idpType.value = [...idpType.value, idp.code];
  }

  if (!shouldBeChecked && isSelected) {
    idpType.value = idpType.value.filter((code) => code !== idp.code);
  }
}

const ID_MODE = computed(() => IdentityMode);

onBeforeMount(() => {
  idpType.value = Array.isArray(form.value.idps) ? [...form.value.idps] : [];
});

watch(idpType, (val) => {
  form.value.idps = [...val];
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

const hasBceidBasicAccessSettings = computed(() =>
  idpType.value.includes(RestrictedIDPs.BCEID_BASIC)
);

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
    <v-alert
      color="primary"
      icon="mdi-alert"
      lines="one"
      class="text-white mb-2"
    >
      Effective May 31, 2026, Connected Services BC (CSBC) stopped onboarding
      new services to Basic BCeID. Instead, it is recommended to use the BC
      Services Card app as the identity solution. This change reflects the
      ongoing modernization of government digital identity services and the
      adoption of identity solutions that support future service delivery needs.
      Existing services and current users of Basic BCeID are not affected by
      this change and existing integrations will continue to operate normally.
      For Identity Service onboarding questions, please connect with
      <a style="color: lightblue" href="mailto:DT.Consulting@gov.bc.ca"
        >DT.Consulting@gov.bc.ca</a
      >
    </v-alert>
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
            <a
              href="https://engage.gov.bc.ca/govtogetherbc/"
              target="_blank"
              rel="noopener noreferrer"
            >
              govTogetherBC.
              <v-icon size="small" color="primary" icon="mdi:mdi-open-in-new" />
            </a>
          </p>
        </BaseInfoCard>
      </v-expand-transition>
      <v-expand-transition>
        <div v-if="form.userType === ID_MODE.LOGIN" class="pl-6">
          <div>
            <div v-for="idp in filteredIDPs" :key="idp.code">
              <v-checkbox
                :model-value="idpType.includes(idp.code)"
                class="my-0"
                hide-details="auto"
                :data-test="`idpType-${idp.hint}`"
                :class="{ 'dir-rtl': isRTL }"
                @update:model-value="(checked) => onIdpToggle(idp, checked)"
              >
                <template #label>
                  <span class="d-flex align-center">
                    <span>{{ idp.display }}</span>

                    <v-chip
                      v-if="idp.restricted"
                      size="x-small"
                      class="ml-2"
                      variant="outlined"
                    >
                      Restricted
                    </v-chip>
                  </span>
                </template>
              </v-checkbox>

              <div v-if="idp.deprecated" class="text-error" :lang="locale">
                {{ $t('trans.formSettings.idpDeprecatedWarning') }}
              </div>
            </div>
            <BaseDialog
              v-model="showDeprecatedIdpDialog"
              type="CONTINUE"
              @close-dialog="cancelDeprecatedIdpRemoval"
              @continue-dialog="confirmDeprecatedIdpRemoval"
            >
              <template #title>
                <span :lang="locale">Remove deprecated login option?</span>
              </template>

              <template #text>
                <span :lang="locale">
                  {{ $t('trans.formSettings.idpDeprecatedDialog') }}
                </span>
              </template>

              <template #button-text-continue>
                <span :lang="locale">Remove</span>
              </template>
            </BaseDialog>
          </div>
          <!-- Mandatory BCeID process notification -->
          <v-expand-transition>
            <BaseInfoCard
              v-if="hasFormAccessSettings && !hasBceidBasicAccessSettings"
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
          <!-- Basic BCeID onboarding halted notification -->
          <v-expand-transition>
            <BaseInfoCard
              v-if="hasBceidBasicAccessSettings"
              class="mr-4 bceid-basic-warning"
              :class="{ 'dir-rtl': isRTL }"
              data-test="bceid-basic-halted-info"
            >
              <h4 class="bceid-basic-warning__title" :lang="locale">
                <v-icon class="mr-3" color="primary" icon="mdi:mdi-alert" />
                {{ $t('trans.formSettings.bceidBasicHalted') }}
              </h4>
              <p class="my-2" :lang="locale">
                {{ $t('trans.formSettings.bceidBasicHaltedA') }} (<a
                  href="https://ociomysc.service-now.com/sp?id=kb_article&amp;sys_id=4221c6932b1a8b9083eaf885d391bfb8&amp;spa=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  :lang="locale"
                  >{{ $t('trans.formSettings.bceidBasicBulletin') }}</a
                >{{ $t('trans.formSettings.bceidBasicHaltedB') }}
              </p>
              <p class="mt-2 mb-0" :lang="locale">
                {{ $t('trans.formSettings.bceidBasicExemptionA') }}
                <a href="mailto:DTConsulting@gov.bc.ca"
                  >DTConsulting@gov.bc.ca</a
                >
                {{ $t('trans.formSettings.bceidBasicExemptionB') }}
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
            <template v-if="useTenantStore().selectedTenant">
              {{ $t('trans.formSettings.groupAccessTooltip')
              }}<v-icon icon="mdi:mdi-account-group" />
            </template>
            <template v-else>
              {{ $t('trans.formSettings.teamMemberTooltip')
              }}<v-icon icon="mdi:mdi-account-multiple" />
            </template>
          </p>
        </BaseInfoCard>
      </v-expand-transition>
    </div>
  </BasePanel>
</template>
<style scoped>
.bceid-basic-warning {
  background-color: #fff4d6;
  border: 1px solid #e0b547;
  border-left: 6px solid #e0a800;
  border-radius: 4px;
}

.bceid-basic-warning__title {
  display: flex;
  align-items: center;
  font-weight: 700;
  color: #313132;
}
</style>
