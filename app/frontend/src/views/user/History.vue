<script setup>
import { storeToRefs } from 'pinia';
import { useFormStore } from '~/store/form';

const { lang } = storeToRefs(useFormStore);
</script>

<template>
  <BaseSecure>
    <h1 class="my-6 text-center" :lang="lang">
      {{ $t('trans.history.submissnHistory') }}
    </h1>
  </BaseSecure>
</template>
