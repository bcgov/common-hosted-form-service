<script>
import BaseSecure from '~/components/base/BaseSecure.vue';
import EmailManagement from '~/components/forms/manage/EmailManagement.vue';
import { IdentityProviders } from '~/utils/constants';

export default {
  name: 'FormEmails',

  components: {
    BaseSecure,
    EmailManagement,
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
  <BaseSecure :idp="[IDP.IDIR]">
    <EmailManagement :form-id="f" />
  </BaseSecure>
</template>
