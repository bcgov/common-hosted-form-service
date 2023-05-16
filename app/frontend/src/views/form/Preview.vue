<template>
  <BaseSecure :idp="[IDP.IDIR]">
    <h1>
      PREVIEW
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-icon color="primary" class="mt-n1 ml-1" v-bind="attrs" v-on="on">
            help_outline
          </v-icon>
        </template>
        <span>
          This shows a preview of the form version design and behaviour as your
          submitters will see it. You cannot submit the form from this page.
        </span>
      </v-tooltip>
    </h1>
    <FormViewer :draftId="d" :formId="f" preview :versionId="v" />
  </BaseSecure>
</template>

<script>
import FormViewer from '@/components/designer/FormViewer.vue';

import { IdentityProviders } from '@/utils/constants';

export default {
  name: 'FormPreview',
  props: {
    d: String,
    f: String,
    v: String,
  },
  components: {
    FormViewer,
  },
  computed: {
    IDP: () => IdentityProviders,
  },
};
</script>
