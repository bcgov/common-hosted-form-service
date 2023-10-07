<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <div
      class="d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse"
    >
      <div>
        <h1 class="mr-auto" :lang="lang">
          {{ $t('trans.emailManagement.emailManagement')
          }}<font-awesome-icon
            class="ml-3"
            color="primary"
            icon="fa-solid fa-flask"
            :class="{ 'mr-2': isRTL }"
          />
        </h1>
        <h3>{{ this.form.name }}</h3>
      </div>
      <div style="z-index: 50">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <router-link :to="{ name: 'FormManage', query: { f: formId } }">
              <v-btn
                class="mx-1"
                color="primary"
                icon
                :disabled="!formId"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>settings</v-icon>
              </v-btn>
            </router-link>
          </template>
          <span :lang="lang">{{ $t('trans.emailManagement.manageForm') }}</span>
        </v-tooltip>
      </div>
    </div>

    <EmailTemplate
      :title="$t('trans.emailManagement.submissionConfirmation')"
      type="submissionConfirmation"
    />
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faFlask } from '@fortawesome/free-solid-svg-icons';
library.add(faFlask);

import EmailTemplate from '@/components/forms/manage/EmailTemplate.vue';

export default {
  name: 'EmailManagement',

  components: {
    EmailTemplate,
  },

  props: {
    formId: {
      required: true,
      type: String,
    },
  },

  computed: {
    ...mapGetters('form', ['form', 'isRTL', 'lang']),
  },

  methods: {
    ...mapActions('form', ['fetchEmailTemplates', 'fetchForm']),
  },

  async created() {
    await Promise.all([
      this.fetchEmailTemplates(this.formId),
      this.fetchForm(this.formId),
    ]);
  },
};
</script>
