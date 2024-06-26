<script>
import { mapActions, mapState } from 'pinia';
import { useI18n } from 'vue-i18n';

import { useAppStore } from '~/store/app';
import { useAdminStore } from '~/store/admin';

export default {
  props: {
    userId: {
      type: String,
      required: true,
    },
  },
  setup() {
    const { locale } = useI18n({ useScope: 'global' });

    return { locale };
  },
  computed: {
    ...mapState(useAppStore, ['config']),
    ...mapState(useAdminStore, ['user']),
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
    <h4 :lang="locale">{{ $t('trans.administerUser.userDetails') }}</h4>
    <pre>{{ user }}</pre>
  </div>
</template>
