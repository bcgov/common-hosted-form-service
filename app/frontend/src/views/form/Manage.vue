<template>
  <BaseSecure :idp="IDP.IDIR">
    <ManageLayout :f="f" />
  </BaseSecure>
</template>

<script>
import ManageLayout from '@/components/forms/manage/ManageLayout.vue';
import { IdentityProviders } from '@/utils/constants';

export default {
  name: 'FormManage',
  components: { ManageLayout },
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
  provide() {
    return {
      fd: this.fd,
      draftId:this.d,
      formId:this.f
    };
  },
  computed: {
    IDP: () => IdentityProviders,
  },
};
</script>
