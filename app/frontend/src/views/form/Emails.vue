<script>
import BaseSecure from '~/components/base/BaseSecure.vue';
import EmailManagement from '~/components/forms/manage/EmailManagement.vue';
import { AppPermissions } from '~/utils/constants';

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
    APP_PERMS: () => AppPermissions,
  },
};
</script>

<template>
  <BaseSecure :permission="APP_PERMS.VIEWS_FORM_EMAILS">
    <EmailManagement :form-id="f" />
  </BaseSecure>
</template>
