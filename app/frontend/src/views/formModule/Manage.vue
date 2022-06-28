<template>
  <BaseSecure :idp="IDP.IDIR">
    <FormModuleManageLayout :fm="fm" />
  </BaseSecure>
</template>

<script>
import FormModuleManageLayout from '@/components/formModule/manage/ManageLayout.vue';
import { IdentityProviders } from '@/utils/constants';

export default {
  name: 'FormModuleManage',
  components: { FormModuleManageLayout },
  props: {
    fm: {
      type: String,
      required: true,
    },
  },
  computed: {
    IDP: () => IdentityProviders,
  },
};
</script>
