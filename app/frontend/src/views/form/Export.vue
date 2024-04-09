<script setup>
import { computed } from 'vue';
import ExportSubmissions from '~/components/forms/ExportSubmissions.vue';
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
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBUSINESS]">
    <ExportSubmissions :form-id="f" />
  </BaseSecure>
</template>
