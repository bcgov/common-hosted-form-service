<script setup>
import { computed } from 'vue';
import FormSubmission from '~/components/forms/FormSubmission.vue';
import { IdentityProviders } from '~/utils/constants';

defineProps({
  s: {
    type: String,
    required: true,
  },
});

const IDP = computed(() => IdentityProviders);
</script>

<template>
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBUSINESS]">
    <FormSubmission :submission-id="s" />
  </BaseSecure>
</template>
