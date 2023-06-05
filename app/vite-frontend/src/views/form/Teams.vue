<script setup>
import { computed } from 'vue';
import BaseSecure from '~/components/base/BaseSecure.vue';
import TeamManagement from '~/components/forms/manage/TeamManagement.vue';
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
    <TeamManagement :form-id="f" />
  </BaseSecure>
</template>
