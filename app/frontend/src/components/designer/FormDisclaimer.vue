<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <h3 class="mb-5" :class="{ 'dir-rtl': isRTL }">
      {{ $t('trans.formDisclaimer.disclaimerAndStatement') }}
    </h3>
    <ul>
      <li>
        <span :class="{ 'dir-rtl': isRTL }">
          {{ $t('trans.formDisclaimer.privacyLaw') }}
        </span>
      </li>
      <li>
        <span :class="{ 'dir-rtl': isRTL }">
          {{ $t('trans.formDisclaimer.disclosure') }}
        </span>
      </li>
      <li>
        <span :class="{ 'dir-rtl': isRTL }">
          {{ $t('trans.formDisclaimer.consent') }}
        </span>
      </li>
      <li :class="{ 'dir-rtl': isRTL }">
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
<style lang="css" scoped>
.dir-rtl {
  direction: rtl !important;
  text-align: right;
}
</style>
