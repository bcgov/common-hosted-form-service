<script setup>
import { computed, provide } from 'vue';
import ManageLayout from '~/components/forms/manage/ManageLayout.vue';
import { IdentityProviders } from '~/utils/constants';

const properties = defineProps({
  f: {
    type: String,
    required: true,
  },
  d: {
    type: String,
    default: null,
  },
  fd: {
    type: Boolean,
    default: false,
  },
});

provide('formDesigner', JSON.parse(properties.fd));
provide('draftId', properties.d);
provide('formId', properties.f);

const IDP = computed(() => IdentityProviders);
</script>

<template>
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBUSINESS]">
    <ManageLayout :f="f" />
  </BaseSecure>
</template>
