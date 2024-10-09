<script setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import { useFormStore } from '~/store/form';

const { locale } = useI18n({ useScope: 'global' });

const { isRTL } = storeToRefs(useFormStore());
</script>

<template>
  <div>
    <h3 class="mb-5" :lang="locale">
      {{ $t('trans.formDisclaimer.disclaimerAndStatement') }}
    </h3>
    <ul :class="isRTL ? 'mr-6' : null">
      <li :lang="locale">
        {{ $t('trans.formDisclaimer.privacyLaw') }}
      </li>
      <li :lang="locale">
        {{ $t('trans.formDisclaimer.disclosure') }}
      </li>
      <li :lang="locale">
        {{ $t('trans.formDisclaimer.consent') }}
      </li>
      <li :lang="locale">
        {{ $t('trans.formDisclaimer.formIntention') }}
        <a
          href="https://www2.gov.bc.ca/gov/content/governments/services-for-government/information-management-technology/privacy/resources/privacy-officers"
          target="_blank"
          :lang="locale"
        >
          {{ $t('trans.formDisclaimer.privacyOfficer') }}
          <v-icon
            size="small"
            color="primary"
            icon="mdi:mdi-open-in-new"
          ></v-icon>
        </a>
        {{ $t('trans.formDisclaimer.assement') }}
      </li>
    </ul>
  </div>
</template>
