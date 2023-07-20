<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <h3 class="mb-5">
      {{ $t('trans.formDisclaimer.disclaimerAndStatement') }}
    </h3>
    <ul :class="isRTL ? 'mr-6' : null">
      <li>
        <span>
          {{ $t('trans.formDisclaimer.privacyLaw') }}
        </span>
      </li>
      <li>
        <span>
          {{ $t('trans.formDisclaimer.disclosure') }}
        </span>
      </li>
      <li>
        <span>
          {{ $t('trans.formDisclaimer.consent') }}
        </span>
      </li>
      <li>
        {{ $t('trans.formDisclaimer.formIntention') }}
        <a
          href="https://www2.gov.bc.ca/gov/content/governments/services-for-government/information-management-technology/privacy/resources/privacy-officers"
          target="_blank"
        >
          {{ $t('trans.formDisclaimer.privacyOfficer') }}
          <v-icon small color="primary">open_in_new</v-icon>
        </a>
        {{ $t('trans.formDisclaimer.assement') }}
      </li>
    </ul>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
export default {
  name: 'FormDisclaimer',
  computed: {
    ...mapGetters('form', ['isRTL']),
  },
};
</script>
