<script>
import BaseSecure from '~/components/base/BaseSecure.vue';
import SubmissionsTable from '~/components/forms/SubmissionsTable.vue';
import { IdentityProviders } from '~/utils/constants';

export default {
  components: {
    BaseSecure,
    SubmissionsTable,
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
    <SubmissionsTable :form-id="f" />
  </BaseSecure>
</template>
