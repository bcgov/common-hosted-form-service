<script>
import BaseSecure from '~/components/base/BaseSecure.vue';
import ManageLayout from '~/components/forms/manage/ManageLayout.vue';
import { AppPermissions } from '~/utils/constants';

export default {
  components: { BaseSecure, ManageLayout },
  provide() {
    return {
      formDesigner: JSON.parse(this.fd),
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
      type: Boolean,
      default: false,
    },
  },
  computed: {
    APP_PERMS: () => AppPermissions,
  },
};
</script>

<template>
  <BaseSecure :permission="APP_PERMS.VIEWS_FORM_MANAGE">
    <ManageLayout :f="f" />
  </BaseSecure>
</template>
