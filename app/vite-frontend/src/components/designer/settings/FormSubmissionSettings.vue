<script setup>
import { storeToRefs } from 'pinia';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';
import { Regex } from '~/utils/constants';

const formStore = useFormStore();

const { form } = storeToRefs(formStore);

const emailArrayRules = [
  (v) =>
    !form.value.sendSubReceivedEmail ||
    v.length > 0 ||
    'Please enter at least 1 email address',
  (v) =>
    !form.value.sendSubReceivedEmail ||
    v.every((item) => new RegExp(Regex.EMAIL).test(item)) ||
    'Please enter all valid email addresses',
];
</script>

<template>
  <BasePanel class="fill-height">
    <template #title>{{ $t('trans.formSettings.afterSubmission') }}</template>
    <v-checkbox v-model="form.showSubmissionConfirmation" class="my-0">
      <template #label>
        {{ $t('trans.formSettings.submissionConfirmation') }}
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-icon color="primary" class="ml-3" v-bind="props">
              help_outline
            </v-icon>
          </template>
          <span>
            <span
              v-html="$t('trans.formSettings.submissionConfirmationToolTip')"
            />
            <ul>
              <li>{{ $t('trans.formSettings.theConfirmationID') }}</li>
              <li>
                {{ $t('trans.formSettings.infoB') }}
              </li>
            </ul>
          </span>
        </v-tooltip>
      </template>
    </v-checkbox>

    <v-checkbox v-model="form.sendSubReceivedEmail" class="my-0">
      <template #label>
        {{ $t('trans.formSettings.emailNotificatnToTeam') }}
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-icon color="primary" class="ml-3" v-bind="props">
              help_outline
            </v-icon>
          </template>
          <span>
            {{ $t('trans.formSettings.emailNotificatnToTeamToolTip') }}
          </span>
        </v-tooltip>
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
    >
      <template #no-data>
        <v-list-item>
          <v-list-item-title>
            Press <kbd>enter</kbd> or <kbd>,</kbd> or <kbd>space</kbd> to add
            multiple email addresses
          </v-list-item-title>
        </v-list-item>
      </template>
    </v-combobox>
  </BasePanel>
</template>
