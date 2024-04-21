<script>
import BaseSecure from '~/components/base/BaseSecure.vue';
import SubmissionsTable from '~/components/forms/SubmissionsTable.vue';
import { AppPermissions } from '~/utils/constants';

export default {
  components: {
    BaseSecure,
    SubmissionsTable,
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
  <BaseSecure :permission="APP_PERMS.VIEWS_FORM_SUBMISSIONS">
    <SubmissionsTable :form-id="f" />
  </BaseSecure>
</template>
