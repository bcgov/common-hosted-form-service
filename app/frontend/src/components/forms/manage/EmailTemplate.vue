<template>
  <v-container>
    <h1 :lang="lang">{{ this.title }}</h1>
    <v-form ref="emailTemplateForm" lazy-validation>
      <v-text-field
        dense
        flat
        outlined
        solid
        :label="$t('trans.emailTemplate.subject')"
        :lang="lang"
        :rules="subjectRules"
        @input="formChanged = true"
        v-model="emailTemplate.subject"
      />
      <v-text-field
        dense
        flat
        outlined
        solid
        :label="$t('trans.emailTemplate.title')"
        :lang="lang"
        :rules="titleRules"
        @input="formChanged = true"
        v-model="emailTemplate.title"
      />
      <v-textarea
        dense
        flat
        outlined
        solid
        :label="$t('trans.emailTemplate.body')"
        :lang="lang"
        :rules="bodyRules"
        @input="formChanged = true"
        v-model="emailTemplate.body"
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

<script>
import { mapActions, mapGetters } from 'vuex';

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
        (v) => !!v || this.$t('trans.emailTemplate.validBodyRequired'),
      ],
      subjectRules: [
        (v) => !!v || this.$t('trans.emailTemplate.validSubjectRequired'),
      ],
      titleRules: [
        (v) => !!v || this.$t('trans.emailTemplate.validTitleRequired'),
      ],
    };
  },

  computed: {
    ...mapGetters('form', ['emailTemplates', 'lang']),

    emailTemplate() {
      return this.emailTemplates.find((t) => t.type === this.type);
    },
  },

  methods: {
    ...mapActions('form', ['updateEmailTemplate']),
    ...mapActions('notifications', ['addNotification']),

    async saveEmailTemplate() {
      try {
        if (this.$refs.emailTemplateForm.validate()) {
          await this.updateEmailTemplate(this.emailTemplate);
        }

        this.formChanged = false;
      } catch (error) {
        this.addNotification({
          message: this.$t('trans.emailTemplate.saveEmailTemplateErrMsg'),
          consoleError: this.$t(
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
