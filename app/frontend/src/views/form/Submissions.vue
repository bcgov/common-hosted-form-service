<template>
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBUSINESS]">
    <SubmissionsTable :formId="f" />
  </BaseSecure>
</template>

<script>
import SubmissionsTable from '@/components/forms/SubmissionsTable.vue';
import { IdentityProviders } from '@/utils/constants';

export default {
  name: 'Submissions',
  props: {
    f: {
      type: String,
      required: true,
    },
  },
  components: {
    SubmissionsTable,
  },
  computed: {
    IDP: () => IdentityProviders,
  },
};
</script>
