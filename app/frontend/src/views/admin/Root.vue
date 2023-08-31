<script>
import { mapState } from 'pinia';
import { useFormStore } from '~/store/form';
import AdminPage from '~/components/admin/AdminPage.vue';

export default {
  components: {
    AdminPage,
  },
  computed: {
    ...mapState(useFormStore, ['isRTL', 'lang']),
  },
};
</script>

<template>
  <v-container>
    <h1 class="mt-6" :class="{ 'dir-rtl': isRTL }" :lang="lang">
      {{ $t('trans.admin.root.admin') }}
    </h1>

    <AdminPage />
  </v-container>
</template>
