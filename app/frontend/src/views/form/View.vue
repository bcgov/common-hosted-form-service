<script>
import BaseSecure from '~/components/base/BaseSecure.vue';
import FormSubmission from '~/components/forms/FormSubmission.vue';
import { AppPermissions } from '~/utils/constants';

export default {
  components: {
    BaseSecure,
    FormSubmission,
  },
  props: {
    s: {
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
  <BaseSecure :permission="APP_PERMS.VIEWS_FORM_VIEW">
    <FormSubmission :submission-id="s" />
  </BaseSecure>
</template>
