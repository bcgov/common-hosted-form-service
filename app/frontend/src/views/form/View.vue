<script>
import BaseSecure from '~/components/base/BaseSecure.vue';
import FormSubmission from '~/components/forms/FormSubmission.vue';
import { IdentityProviders } from '~/utils/constants';

export default {
  components: {
    BaseSecure,
    FormSubmission,
  },
  props: {
    s: {
      type: String,
      required: true,
    },
  },
  computed: {
    IDP: () => IdentityProviders,
  },
};
</script>

<template>
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBUSINESS]">
    <FormSubmission :submission-id="s" />
  </BaseSecure>
</template>
