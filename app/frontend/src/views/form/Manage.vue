<template>
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBUSINESS]">
    <ManageLayout :f="f" />
  </BaseSecure>
</template>

<script>
import ManageLayout from '@src/components/forms/manage/ManageLayout.vue';
import { IdentityProviders } from '@src/utils/constants';

export default {
  name: 'FormManage',
  components: { ManageLayout },
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
    },
    fd: {
      type: String,
    },
  },
  computed: {
    IDP: () => IdentityProviders,
  },
};
</script>
