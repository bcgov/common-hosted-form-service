<template>
  <v-container>
    <h1 class="mt-6" :lang="lang" :class="{ 'dir-rtl': isRTL }">
      {{ $t('trans.admin.form.administerForm') }}
    </h1>
    <AdministerForm :formId="f" />
  </v-container>
</template>

<script>
import AdministerForm from '@/components/admin/AdministerForm.vue';
import { mapGetters } from 'vuex';

export default {
  name: 'AdminFormView',
  components: {
    AdministerForm,
  },
  props: {
    f: String,
  },
  computed: {
    ...mapGetters('form', ['lang', 'isRTL']),
  },
};
</script>
