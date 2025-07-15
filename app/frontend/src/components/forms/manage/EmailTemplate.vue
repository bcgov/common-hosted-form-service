<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

const { t, locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  title: {
    required: true,
    type: String,
  },
  type: {
    required: true,
    type: String,
  },
});

const emailTemplateForm = ref(null);
const formChanged = ref(false);
/* c8 ignore start */
const bodyRules = ref([
  (v) => !!v || t('trans.emailTemplate.validBodyRequired'),
]);
const subjectRules = ref([
  (v) => !!v || t('trans.emailTemplate.validSubjectRequired'),
]);
const titleRules = ref([
  (v) => !!v || t('trans.emailTemplate.validTitleRequired'),
]);
/* c8 ignore end */

const formStore = useFormStore();

const { emailTemplates } = storeToRefs(formStore);

const emailTemplate = computed(() =>
  emailTemplates.value.find((t) => t.type === properties.type)
);

async function saveEmailTemplate() {
  try {
    if (emailTemplateForm.value.validate()) {
      await formStore.updateEmailTemplate(emailTemplate.value);
    }

    formChanged.value = false;
  } catch (error) {
    const notificationStore = useNotificationStore();
    notificationStore.addNotification({
      text: t('trans.emailTemplate.saveEmailTemplateErrMsg'),
      consoleError: t('trans.emailTemplate.saveEmailTemplateConsoleErrMsg', {
        formId: emailTemplate.value.formId,
        error: error,
      }),
    });
  }
}

defineExpose({ saveEmailTemplate });
</script>

<template>
  <v-container>
    <h1 :lang="locale">{{ title }}</h1>
    <v-form ref="emailTemplateForm" lazy-validation>
      <v-text-field
        v-if="emailTemplates.length > 0"
        v-model="emailTemplate.subject"
        density="compact"
        flat
        variant="outlined"
        solid
        :label="$t('trans.emailTemplate.subject')"
        :lang="locale"
        :rules="subjectRules"
        :maxlength="255"
        counter
        @update:model-value="formChanged = true"
      />
      <v-text-field
        v-if="emailTemplates.length > 0"
        v-model="emailTemplate.title"
        density="compact"
        flat
        variant="outlined"
        solid
        :label="$t('trans.emailTemplate.title')"
        :lang="locale"
        :rules="titleRules"
        :maxlength="255"
        counter
        @update:model-value="formChanged = true"
      />
      <v-textarea
        v-if="emailTemplates.length > 0"
        v-model="emailTemplate.body"
        density="compact"
        flat
        variant="outlined"
        solid
        :label="$t('trans.emailTemplate.body')"
        :lang="locale"
        :rules="bodyRules"
        :maxlength="4096"
        counter
        @update:model-value="formChanged = true"
      />
      <v-btn
        class="mr-5"
        color="primary"
        :disabled="!formChanged"
        :title="$t('trans.emailTemplate.save')"
        @click="saveEmailTemplate"
      >
        <span :lang="locale">{{ $t('trans.emailTemplate.save') }}</span>
      </v-btn>
    </v-form>
  </v-container>
</template>
