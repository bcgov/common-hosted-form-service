<script>
import BaseSecure from '~/components/base/BaseSecure.vue';
import TeamManagement from '~/components/forms/manage/TeamManagement.vue';
import { AppPermissions } from '~/utils/constants';

export default {
  components: {
    BaseSecure,
    TeamManagement,
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
  <BaseSecure :permission="APP_PERMS.VIEWS_FORM_TEAMS">
    <TeamManagement :form-id="f" />
  </BaseSecure>
</template>
