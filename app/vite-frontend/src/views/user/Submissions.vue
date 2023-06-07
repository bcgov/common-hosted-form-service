<script setup>
import { computed } from 'vue';
import BaseSecure from '~/components/base/BaseSecure.vue';
import MySubmissionsTable from '~/components/forms/submission/MySubmissionsTable.vue';
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
    <MySubmissionsTable :form-id="f" />
  </BaseSecure>
</template>
