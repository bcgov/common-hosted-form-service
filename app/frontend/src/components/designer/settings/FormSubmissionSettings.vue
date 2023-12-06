<script>
import { mapState, mapWritableState } from 'pinia';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';
import { Regex } from '~/utils/constants';

export default {
  components: {
    BasePanel,
  },
  data() {
    return {
      emailArrayRules: [
        (v) =>
          !this.form.sendSubReceivedEmail ||
          v.length > 0 ||
          this.$t('trans.formSettings.atLeastOneEmailReq'),
        (v) =>
          !this.form.sendSubReceivedEmail ||
          v.every((item) => new RegExp(Regex.EMAIL).test(item)) ||
          this.$t('trans.formSettings.validEmailRequired'),
      ],
    };
  },
  computed: {
    ...mapState(useFormStore, ['isRTL', 'lang']),
    ...mapWritableState(useFormStore, ['form']),
  },
};
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="lang">
        {{ $t('trans.formSettings.afterSubmission') }}
      </span></template
    >
    <v-checkbox
      v-model="form.showSubmissionConfirmation"
      hide-details="auto"
      class="my-0"
      :class="{ 'dir-rtl': isRTL }"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span :lang="lang">
            {{ $t('trans.formSettings.submissionConfirmation') }}</span
          >
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-icon
                color="primary"
                class="ml-3"
                :class="{ 'mr-2': isRTL }"
                v-bind="props"
                icon="mdi:mdi-help-circle-outline"
              />
            </template>
            <span>
              <span
                :lang="lang"
                v-html="$t('trans.formSettings.submissionConfirmationToolTip')"
              />
              <ul>
                <li :lang="lang">
                  {{ $t('trans.formSettings.theConfirmationID') }}
                </li>
                <li :lang="lang">
                  {{ $t('trans.formSettings.infoB') }}
                </li>
              </ul>
            </span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <v-checkbox
      v-model="form.sendSubReceivedEmail"
      hide-details="auto"
      class="my-0"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span :lang="lang">
            {{ $t('trans.formSettings.emailNotificatnToTeam') }}</span
          >
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-icon
                color="primary"
                class="ml-3"
                :class="{ 'mr-2': isRTL }"
                v-bind="props"
                icon="mdi:mdi-help-circle-outline"
              />
            </template>
            <span :lang="lang">
              {{ $t('trans.formSettings.emailNotificatnToTeamToolTip') }}
            </span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <v-combobox
      v-if="form.sendSubReceivedEmail"
      v-model="form.submissionReceivedEmails"
      :hide-no-data="false"
      :rules="emailArrayRules"
      solid
      variant="outlined"
      hide-selected
      clearable
      :hint="$t('trans.formSettings.addMoreValidEmailAddrs')"
      :label="$t('trans.formSettings.notificationEmailAddrs')"
      multiple
      chips
      closable-chips
      :delimiters="[' ', ',']"
      append-icon=""
      :lang="lang"
    >
      <template #no-data>
        <v-list-item>
          <v-list-item-title>
            <span
              :lang="lang"
              v-html="$t('trans.formSettings.pressToAddMultiEmail')"
            />
          </v-list-item-title>
        </v-list-item>
      </template>
    </v-combobox>
  </BasePanel>
</template>
