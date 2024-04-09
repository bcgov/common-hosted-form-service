<script setup>
import { computed } from 'vue';
import SubmissionsTable from '~/components/forms/SubmissionsTable.vue';
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
    <SubmissionsTable :form-id="f" />
  </BaseSecure>
</template>
