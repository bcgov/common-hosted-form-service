<template>
  <BaseSecure :idp="[IDP.IDIR]">
    <FormSubmission :submissionId="s" />
  </BaseSecure>
</template>

<script>
import FormSubmission from '@/components/forms/FormSubmission.vue';
import { IdentityProviders } from '@/utils/constants';

export default {
  name: 'FormView',
  props: {
    s: String,
  },
  components: {
    FormSubmission,
  },
  computed: {
    IDP: () => IdentityProviders,
  }
};
</script>
