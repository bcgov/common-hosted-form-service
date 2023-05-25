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
    <template #title>After Submission</template>
    <v-checkbox v-model="form.showSubmissionConfirmation" class="my-0">
      <template #label>
        Show the submission confirmation details
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-icon color="primary" class="ml-3" v-bind="props">
              help_outline
            </v-icon>
          </template>
          <span>
            Selecting this option controls what the submitting user of this form
            will see on successful submission. <br />
            If checked, it will display
            <ul>
              <li>the Confirmation ID</li>
              <li>
                the option for the user to email themselves a submission
                confirmation
              </li>
            </ul>
          </span>
        </v-tooltip>
      </template>
    </v-checkbox>

    <v-checkbox v-model="form.sendSubReceivedEmail" class="my-0">
      <template #label>
        Send my team a notification email
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-icon color="primary" class="ml-3" v-bind="props">
              help_outline
            </v-icon>
          </template>
          <span>
            Send a notification to your specified email address when any user
            submits this form
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
      hint="Add one or more valid email addresses"
      label="Notification Email Addresses"
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
