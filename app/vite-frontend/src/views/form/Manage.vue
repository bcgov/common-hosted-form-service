<script setup>
import { computed, provide } from 'vue';
import ManageLayout from '~/components/forms/manage/ManageLayout.vue';
import { IdentityProviders } from '~/utils/constants';

const props = defineProps({
  f: {
    type: String,
    required: true,
  },
  d: {
    type: String,
    default: null,
  },
  fd: {
    type: String,
    default: null,
  },
});

provide('f', props.f);
provide('d', props.d);
provide('fd', props.fd);

const IDP = computed(() => IdentityProviders);
</script>

<template>
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBUSINESS]">
    <ManageLayout :f="f"
  /></BaseSecure>
</template>
