<template>
  <v-container>
    <h1 class="mt-6">Administer User</h1>
    <AdministerUser :user-id="u" />
  </v-container>
</template>

<script>
import AdministerUser from '@/components/admin/AdministerUser.vue';

export default {
  name: 'AdminUserView',
  components: {
    AdministerUser,
  },
  props: {
    u: String,
  },
};
</script>
