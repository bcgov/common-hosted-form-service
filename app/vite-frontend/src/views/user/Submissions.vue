<script setup>
import BaseSecure from '~/components/base/BaseSecure.vue';
import SubmissionsTable from '~/components/forms/SubmissionsTable.vue';
</script>

<template>
  <BaseSecure :idp="[IDP.IDIR, IDP.BCEIDBUSINESS]">
    <SubmissionsTable :form-id="f" />
  </BaseSecure>
</template>
