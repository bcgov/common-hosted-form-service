<script setup>
import MySubmissionsTable from '~/components/forms/submission/MySubmissionsTable.vue';
import { IdentityProviders } from '~/utils/constants';

defineProps({
  f: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <BaseSecure
    :idp="[
      IdentityProviders.IDIR,
      IdentityProviders.BCEIDBASIC,
      IdentityProviders.BCEIDBUSINESS,
    ]"
  >
    <MySubmissionsTable :form-id="f" />
  </BaseSecure>
</template>
