<template>
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBUSINESS]">
    <FormSubmission :submission-id="s" />
  </BaseSecure>
</template>

<script>
import FormSubmission from '@/components/forms/FormSubmission.vue';
import { IdentityProviders } from '@/utils/constants';

export default {
  name: 'FormView',
  components: {
    FormSubmission,
  },
  props: {
    s: String,
  },
  computed: {
    IDP: () => IdentityProviders,
  },
};
</script>
