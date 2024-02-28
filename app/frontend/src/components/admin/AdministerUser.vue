<script>
import { mapActions, mapState } from 'pinia';

import { useAppStore } from '~/store/app';
import { useAdminStore } from '~/store/admin';
import { useFormStore } from '~/store/form';

export default {
  props: {
    userId: {
      type: String,
      required: true,
    },
  },
  computed: {
    ...mapState(useAppStore, ['config']),
    ...mapState(useAdminStore, ['user']),
    ...mapState(useFormStore, ['lang']),
  },
  async mounted() {
    await this.readUser(this.userId);
  },
  methods: {
    ...mapActions(useAdminStore, ['readUser']),
  },
};
</script>

<template>
  <div>
    <h3>{{ user.fullName }}</h3>
    <h4 :lang="lang">{{ $t('trans.administerUser.userDetails') }}</h4>
    <pre>{{ user }}</pre>
  </div>
</template>
