<template>
  <BaseSecure :idp="[IDP.IDIR]">
    <EmailManagement :formId="f" />
  </BaseSecure>
</template>

<script>
import EmailManagement from '@/components/forms/manage/EmailManagement.vue';
import { IdentityProviders } from '@/utils/constants';

export default {
  name: 'FormEmails',

  components: {
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
