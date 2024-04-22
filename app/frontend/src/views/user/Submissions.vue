<script>
import BaseSecure from '~/components/base/BaseSecure.vue';
import MySubmissionsTable from '~/components/forms/submission/MySubmissionsTable.vue';
import { AppPermissions } from '~/utils/constants';

export default {
  components: {
    BaseSecure,
    MySubmissionsTable,
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
  <BaseSecure :permission="APP_PERMS.VIEWS_USER_SUBMISSIONS">
    <MySubmissionsTable :form-id="f" />
  </BaseSecure>
</template>
