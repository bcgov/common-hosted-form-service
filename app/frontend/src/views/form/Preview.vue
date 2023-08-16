<script>
import BaseSecure from '~/components/base/BaseSecure.vue';
import FormViewer from '~/components/designer/FormViewer.vue';

import { IdentityProviders } from '~/utils/constants';

export default {
  components: {
    BaseSecure,
    FormViewer,
  },
  props: {
    d: {
      type: String,
      default: null,
    },
    f: {
      type: String,
      default: null,
    },
    v: {
      type: String,
      default: null,
    },
  },
  computed: {
    IDP: () => IdentityProviders,
  },
};
</script>

<template>
  <BaseSecure :idp="[IDP.IDIR]">
    <h1>
      PREVIEW
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-icon
            color="primary"
            class="mt-n1 ml-1"
            v-bind="props"
            icon="mdi:mdi-help-circle-outline"
          />
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
