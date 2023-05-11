<template>
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBUSINESS]">
    <MySubmissionsTable :form-id="f" />
  </BaseSecure>
</template>

<script>
import MySubmissionsTable from '@src/components/forms/submission/MySubmissionsTable.vue';
import { IdentityProviders } from '@src/utils/constants';

export default {
  name: 'Submissions',
  components: {
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
