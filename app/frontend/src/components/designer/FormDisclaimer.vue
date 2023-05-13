<template>
  <div>
    <h3 class="mb-5">
      {{ $t('trans.formDisclaimer.disclaimerAndStatement') }}
    </h3>
    <ul>
      <li>
        {{ $t('trans.formDisclaimer.privacyLaw') }}
      </li>
      <li>
        {{ $t('trans.formDisclaimer.disclosure') }}
      </li>
      <li>
        {{ $t('trans.formDisclaimer.consent') }}
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
export default {
  name: 'FormDisclaimer',
};
</script>
