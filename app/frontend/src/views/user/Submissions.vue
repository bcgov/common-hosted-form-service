<script>
import BaseSecure from '~/components/base/BaseSecure.vue';
import MySubmissionsTable from '~/components/forms/submission/MySubmissionsTable.vue';
import { IdentityProviders } from '~/utils/constants';

export default {
  components: {
    BaseSecure,
    MySubmissionsTable,
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
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBASIC, IDP.BCEIDBUSINESS]">
    <MySubmissionsTable :form-id="f" />
  </BaseSecure>
</template>
