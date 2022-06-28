<template>
  <BaseSecure :idp="IDP.IDIR">
    <FormModuleVersionManageLayout :fm="fm" :fmv="fmv" />
  </BaseSecure>
</template>

<script>
import FormModuleVersionManageLayout from '@/components/formModuleVersion/manage/ManageLayout.vue';
import { IdentityProviders } from '@/utils/constants';

export default {
  name: 'FormModuleVersionManage',
  components: { FormModuleVersionManageLayout },
  props: {
    fm: {
      type: String,
      required: true,
    },
    fmv: {
      type: String,
      required: true,
    },
  },
  computed: {
    IDP: () => IdentityProviders,
  },
};
</script>
