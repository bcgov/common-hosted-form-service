<template>
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBUSINESS]">
    <TeamManagement :form-id="f" />
  </BaseSecure>
</template>

<script>
import TeamManagement from '@src/components/forms/manage/TeamManagement.vue';
import { IdentityProviders } from '@src/utils/constants';

export default {
  name: 'FormTeams',
  components: {
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
