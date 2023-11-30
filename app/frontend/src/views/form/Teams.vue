<script>
import BaseSecure from '~/components/base/BaseSecure.vue';
import TeamManagement from '~/components/forms/manage/TeamManagement.vue';
import { IdentityProviders } from '~/utils/constants';

export default {
  components: {
    BaseSecure,
    TeamManagement,
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
    <TeamManagement :form-id="f" />
  </BaseSecure>
</template>
