<script>
import { mapState } from 'pinia';
import AdministerForm from '~/components/admin/AdministerForm.vue';
import { useFormStore } from '~/store/form';

export default {
  components: {
    AdministerForm,
  },
  props: {
    f: {
      type: String,
      required: true,
    },
  },
  computed: {
    ...mapState(useFormStore, ['isRTL', 'lang']),
  },
};
</script>

<template>
  <v-container>
    <h1 class="mt-6" :lang="lang" :class="{ 'dir-rtl': isRTL }">
      {{ $t('trans.admin.form.administerForm') }}
    </h1>

    <AdministerForm :form-id="f" />
  </v-container>
</template>
