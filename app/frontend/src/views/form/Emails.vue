<script setup>
import { computed } from 'vue';
import EmailManagement from '~/components/forms/manage/EmailManagement.vue';
import { IdentityProviders } from '~/utils/constants';

defineProps({
  f: {
    type: String,
    required: true,
  },
});

const IDP = computed(() => IdentityProviders);
</script>

<template>
  <BaseSecure :idp="[IDP.IDIR]">
    <EmailManagement :form-id="f" />
  </BaseSecure>
</template>
