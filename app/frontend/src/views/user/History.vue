<script>
import { mapState } from 'pinia';
import BaseSecure from '~/components/base/BaseSecure.vue';
import { useFormStore } from '~/store/form';

export default {
  components: {
    BaseSecure,
  },
  computed: {
    ...mapState(useFormStore, ['lang']),
  },
};
</script>

<template>
  <BaseSecure>
    <h1 class="my-6 text-center" :lang="lang">
      {{ $t('trans.history.submissnHistory') }}
    </h1>
  </BaseSecure>
</template>
