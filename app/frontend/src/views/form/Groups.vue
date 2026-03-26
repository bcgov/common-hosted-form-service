<script setup>
import GroupManagement from '~/components/forms/manage/GroupManagement.vue';

defineProps({
  f: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <GroupManagement :form-id="f" />
</template>
