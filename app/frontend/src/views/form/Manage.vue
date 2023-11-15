<template>
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBUSINESS]">
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
      type: Boolean,
      default: false,
    },
  },
  provide() {
    return {
      formDesigner: JSON.parse(this.fd),
      draftId: this.d,
      formId: this.f,
    };
  },
  computed: {
    IDP: () => IdentityProviders,
  },
};
</script>
