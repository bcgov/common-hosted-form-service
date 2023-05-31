<script setup>
import { computed } from 'vue';
import BaseSecure from '~/components/base/BaseSecure.vue';
import FormViewer from '~/components/designer/FormViewer.vue';

import { IdentityProviders } from '~/utils/constants';

defineProps({
  d: {
    type: String,
    required: true,
  },
  f: {
    type: String,
    required: true,
  },
  v: {
    type: String,
    required: true,
  },
});

const IDP = computed(() => IdentityProviders);
</script>

<template>
  <BaseSecure :idp="[IDP.IDIR]">
    <h1>
      PREVIEW
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-icon color="primary" class="mt-n1 ml-1" v-bind="props">
            help_outline
          </v-icon>
        </template>
        <span>
          This shows a preview of the form version design and behaviour as your
          submitters will see it. You cannot submit the form from this page.
        </span>
      </v-tooltip>
    </h1>
    <FormViewer :draft-id="d" :form-id="f" preview :version-id="v" />
  </BaseSecure>
</template>
