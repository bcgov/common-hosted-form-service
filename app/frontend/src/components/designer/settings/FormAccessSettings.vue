<script>
import BasePanel from '~/components/base/BasePanel.vue';
import BaseInfoCard from '~/components/base/BaseInfoCard.vue';
import { IdentityMode, IdentityProviders } from '~/utils/constants';
import { useFormStore } from '~/store/form';
import { mapWritableState } from 'pinia';

export default {
  components: {
    BasePanel,
    BaseInfoCard,
  },
  data() {
    return {
      loginRequiredRules: [
        (v) => {
          return (
            v !== 'login' ||
            this.form.idps.length === 1 ||
            this.$t('trans.formSettings.selectLoginType')
          );
        },
      ],
    };
  },
  computed: {
    ...mapWritableState(useFormStore, ['form']),
    ID_MODE() {
      return IdentityMode;
    },
    ID_PROVIDERS() {
      return IdentityProviders;
    },
  },
  methods: {
    userTypeChanged() {
      // if they checked enable drafts then went back to public, uncheck it
      if (this.form.userType === this.ID_MODE.PUBLIC) {
        this.form = {
          ...this.form,
          enableSubmitterDraft: false,
          enableCopyExistingSubmission: false,
        };
      }
      if (this.form.userType !== 'team') {
        this.form = {
          ...this.form,
          reminder_enabled: false,
        };
      }
    },
  },
};
</script>

<template>
  <BasePanel class="fill-height">
    <template #title>{{ $t('trans.formSettings.formAccess') }}</template>
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
        :label="$t('trans.formSettings.public')"
        :value="ID_MODE.PUBLIC"
      />
      <v-expand-transition>
        <BaseInfoCard v-if="form.userType == ID_MODE.PUBLIC" class="mr-4 mb-3">
          <h4 class="text-primary">
            <v-icon class="mr-1" color="primary" icon="mdi:mdi-information" />
            {{ $t('trans.formSettings.important') }}!
          </h4>
          <p class="mt-2 mb-0">
            {{ $t('trans.formSettings.info') }}
            <a href="https://engage.gov.bc.ca/govtogetherbc/" target="_blank">
              govTogetherBC.
              <v-icon size="small" color="primary" icon="mdi:mdi-open-in-new" />
            </a>
          </p>
        </BaseInfoCard>
      </v-expand-transition>
      <v-radio
        class="mb-4"
        :label="$t('trans.formSettings.loginRequired')"
        :value="ID_MODE.LOGIN"
      />
      <v-expand-transition>
        <v-row v-if="form.userType === ID_MODE.LOGIN" class="pl-6">
          <v-radio-group v-model="form.idps[0]" class="my-0">
            <v-radio class="mx-2" label="IDIR" :value="ID_PROVIDERS.IDIR" />
            <v-radio
              class="mx-2"
              label="Basic BCeID"
              :value="ID_PROVIDERS.BCEIDBASIC"
            />
            <v-radio
              class="mx-2"
              label="Business BCeID"
              :value="ID_PROVIDERS.BCEIDBUSINESS"
            />
            <!-- Mandatory BCeID process notification -->
            <v-expand-transition>
              <BaseInfoCard
                v-if="
                  form.idps[0] &&
                  [
                    ID_PROVIDERS.BCEIDBASIC,
                    ID_PROVIDERS.BCEIDBUSINESS,
                  ].includes(form.idps[0])
                "
                class="mr-4"
              >
                <h4 class="text-primary">
                  <v-icon
                    class="mr-1"
                    color="primary"
                    icon="mdi:mdi-information"
                  />{{ $t('trans.formSettings.important') }}!
                </h4>
                <p class="my-2">
                  {{ $t('trans.formSettings.idimNotifyA') }} (<a
                    href="mailto:IDIM.Consulting@gov.bc.ca"
                    >IDIM.Consulting@gov.bc.ca</a
                  >) {{ $t('trans.formSettings.idimNotifyB') }}
                </p>
                <p class="mt-2 mb-0">
                  {{ $t('trans.formSettings.referenceGuideA') }}
                  <a
                    href="https://github.com/bcgov/common-hosted-form-service/wiki/Accessing-forms#Notify-the-idim-team-if-you-are-using-bceid"
                    >{{ $t('trans.formSettings.referenceGuideB') }}</a
                  >
                  {{ $t('trans.formSettings.referenceGuideC') }}.
                </p>
              </BaseInfoCard>
            </v-expand-transition>
          </v-radio-group>
        </v-row>
      </v-expand-transition>
      <v-radio
        :label="$t('trans.formSettings.specificTeamMembers')"
        :value="ID_MODE.TEAM"
      />
    </v-radio-group>
  </BasePanel>
</template>
