<template>
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBUSINESS]">
    <ExportSubmissions :formId="f" />
  </BaseSecure>
</template>

<script>
import ExportSubmissions from '@src/components/forms/ExportSubmissions.vue';
import { IdentityProviders } from '@src/utils/constants';
export default {
  name: 'Export',
  components: {
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
