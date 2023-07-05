<script>
import BaseSecure from '~/components/base/BaseSecure.vue';
import ManageLayout from '~/components/forms/manage/ManageLayout.vue';
import { IdentityProviders } from '~/utils/constants';

export default {
  components: { BaseSecure, ManageLayout },
  provide() {
    return {
      fd: this.fd,
      draftId: this.d,
      formId: this.f,
    };
  },
  props: {
    f: {
      type: String,
      required: true,
    },
    d: {
      type: String,
      default: null,
    },
    fd: {
      type: String,
      default: null,
    },
  },
  computed: {
    IDP: () => IdentityProviders,
  },
};
</script>

<template>
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBUSINESS]">
    <ManageLayout :f="f" />
  </BaseSecure>
</template>
