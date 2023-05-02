<template>
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBUSINESS]">
    <SubmissionsTable :form-id="f" />
  </BaseSecure>
</template>

<script>
import SubmissionsTable from '@/components/forms/SubmissionsTable.vue';
import { IdentityProviders } from '@/utils/constants';

export default {
  name: 'Submissions',
  components: {
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
