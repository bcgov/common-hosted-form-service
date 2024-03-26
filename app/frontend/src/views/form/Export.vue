<script>
import BaseSecure from '~/components/base/BaseSecure.vue';
import ExportSubmissions from '~/components/forms/ExportSubmissions.vue';
import { AppPermissions } from '~/utils/constants';

export default {
  components: {
    BaseSecure,
    ExportSubmissions,
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
  <BaseSecure :permission="APP_PERMS.VIEWS_FORM_EXPORT">
    <ExportSubmissions :form-id="f" />
  </BaseSecure>
</template>
