<script>
import BaseSecure from '~/components/base/BaseSecure.vue';
import ExportSubmissions from '~/components/forms/ExportSubmissions.vue';
import { IdentityProviders } from '~/utils/constants';

export default {
  components: {
    BaseSecure,
    ExportSubmissions,
  },
  props: {
    f: {
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
    <ExportSubmissions :form-id="f" />
  </BaseSecure>
</template>
