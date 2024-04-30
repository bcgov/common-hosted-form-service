<script setup>
import { computed, provide } from 'vue';
import ManageLayout from '~/components/forms/manage/ManageLayout.vue';
import { AppPermissions } from '~/utils/constants';

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

const APP_PERMS = computed(() => AppPermissions);
</script>

<template>
  <BaseSecure :permission="APP_PERMS.VIEWS_FORM_MANAGE">
    <ManageLayout :f="f" />
  </BaseSecure>
</template>
