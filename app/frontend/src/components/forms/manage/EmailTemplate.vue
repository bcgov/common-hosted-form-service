<script>
import { mapActions, mapState } from 'pinia';
import { i18n } from '~/internationalization';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

export default {
  name: 'EmailTemplate',

  props: {
    title: {
      required: true,
      type: String,
    },
    type: {
      required: true,
      type: String,
    },
  },

  data() {
    return {
      // If any field on the form changes, then enable the Save button. Note:
      // Will stay enabled if the field is changed back to its original value.
      formChanged: false,

      // Validation rules.
      bodyRules: [
        (v) => !!v || i18n.t('trans.emailTemplate.validBodyRequired'),
      ],
      subjectRules: [
        (v) => !!v || i18n.t('trans.emailTemplate.validSubjectRequired'),
      ],
      titleRules: [
        (v) => !!v || i18n.t('trans.emailTemplate.validTitleRequired'),
      ],
    };
  },

  computed: {
    ...mapState(useFormStore, ['emailTemplates', 'lang']),

    emailTemplate() {
      return this.emailTemplates.find((t) => t.type === this.type);
    },
  },

  methods: {
    ...mapActions(useFormStore, ['updateEmailTemplate']),
    ...mapActions(useNotificationStore, ['addNotification']),

    async saveEmailTemplate() {
      try {
        if (this.$refs.emailTemplateForm.validate()) {
          await this.updateEmailTemplate(this.emailTemplate);
        }

        this.formChanged = false;
      } catch (error) {
        this.addNotification({
          message: i18n.t('trans.emailTemplate.saveEmailTemplateErrMsg'),
          consoleError: i18n.t(
            'trans.emailTemplate.saveEmailTemplateConsoleErrMsg',
            {
              formId: this.emailTemplate.formId,
              error: error,
            }
          ),
        });
      }
    },
  },
};
</script>

<template>
  <v-container>
    <h1 :lang="lang">{{ title }}</h1>
    <v-form ref="emailTemplateForm" lazy-validation>
      <v-text-field
        v-if="emailTemplates.length > 0"
        v-model="emailTemplate.subject"
        density="compact"
        flat
        variant="outlined"
        solid
        :label="$t('trans.emailTemplate.subject')"
        :lang="lang"
        :rules="subjectRules"
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
        :lang="lang"
        :rules="titleRules"
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
        :lang="lang"
        :rules="bodyRules"
        @update:model-value="formChanged = true"
      />
      <v-btn
        class="mr-5"
        color="primary"
        :disabled="!formChanged"
        @click="saveEmailTemplate"
      >
        <span :lang="lang">{{ $t('trans.emailTemplate.save') }}</span>
      </v-btn>
    </v-form>
  </v-container>
</template>
