<script setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import EmailTemplate from '~/components/forms/manage/EmailTemplate.vue';
import { useFormStore } from '~/store/form';

const { locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  formId: {
    required: true,
    type: String,
  },
});

const formStore = useFormStore();
const { form, isRTL } = storeToRefs(formStore);

Promise.all([
  formStore.fetchEmailTemplates(properties.formId),
  formStore.fetchForm(properties.formId),
]);
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <div
      class="d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse"
    >
      <div>
        <h1 class="mr-auto" :lang="locale">
          {{ $t('trans.emailManagement.emailManagement')
          }}<v-icon
            color="primary"
            class="ml-3"
            size="small"
            density="default"
            :class="{ 'mr-2': isRTL }"
            icon="mdi:mdi-flask"
          />
        </h1>
        <h3>{{ form.name }}</h3>
      </div>
      <div style="z-index: 50">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <router-link :to="{ name: 'FormManage', query: { f: formId } }">
              <v-btn
                class="mx-1"
                color="primary"
                size="x-small"
                density="default"
                icon
                :disabled="!formId"
                v-bind="props"
                :title="$t('trans.emailManagement.manageForm')"
              >
                <v-icon icon="mdi:mdi-cog"></v-icon>
              </v-btn>
            </router-link>
          </template>
          <span :lang="locale">{{
            $t('trans.emailManagement.manageForm')
          }}</span>
        </v-tooltip>
      </div>
    </div>

    <EmailTemplate
      :title="$t('trans.emailManagement.submissionConfirmation')"
      type="submissionConfirmation"
    />
  </div>
</template>
