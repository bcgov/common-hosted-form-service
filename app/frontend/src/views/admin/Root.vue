<template>
  <v-container>
    <h1 class="mt-6" :class="{ 'dir-rtl': isRTL }" :lang="lang">
      {{ $t('trans.admin.root.admin') }}
    </h1>

    <AdminPage />
  </v-container>
</template>

<script>
import AdminPage from '@/components/admin/AdminPage.vue';
import { mapGetters } from 'vuex';
export default {
  name: 'AdminRoot',
  components: {
    AdminPage,
  },
  computed: {
    ...mapGetters('form', ['isRTL', 'lang']),
  },
};
</script>
