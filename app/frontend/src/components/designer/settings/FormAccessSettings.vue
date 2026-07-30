<!-- eslint-disable no-console -->
<script setup>
import { storeToRefs } from 'pinia';
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { IdentityMode, DeprecatedIDPs } from '~/utils/constants';
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

const filteredIDPs = ref(
  formAccessButtons.value
    .filter(
      (idp) =>
        !deprecatedIDPs.includes(idp.code) || form.value.idps.includes(idp.code)
    )
    .map((idp) => ({
      ...idp,
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
      Basic BCeID is no longer onboarding new services to the identity solution.
      Existing services and current users of Basic BCeID are not affected by
      this change and existing integrations will continue to operate normally.
      Additional details regarding this change will be available in a Service
      Bulletin in late July. For Identity Service onboarding questions, please
      connect with
      <a href="mailto:DT.Consulting@gov.bc.ca">DT.Consulting@gov.bc.ca</a>
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
                :label="idp.display"
                class="my-0"
                hide-details="auto"
                :data-test="`idpType-${idp.hint}`"
                :class="{ 'dir-rtl': isRTL }"
                @update:model-value="(checked) => onIdpToggle(idp, checked)"
              />

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
