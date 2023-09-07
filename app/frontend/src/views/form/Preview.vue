<template>
  <BaseSecure :idp="[IDP.IDIR]">
    <h1
      :class="{ 'dir-rtl': isRTL }"
      :lang="lang"
      style="text-align: left !important"
    >
      {{ $t('trans.preview.preview') }}
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-icon color="primary" class="mt-n1 ml-1" v-bind="attrs" v-on="on">
            help_outline
          </v-icon>
        </template>
        <span :lang="lang">
          {{ $t('trans.preview.previewToolTip') }}
        </span>
      </v-tooltip>
    </h1>
    <FormViewer :draftId="d" :formId="f" preview :versionId="v" />
  </BaseSecure>
</template>

<script>
import FormViewer from '@/components/designer/FormViewer.vue';
import { mapGetters } from 'vuex';
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
    ...mapGetters('form', ['isRTL', 'lang']),
    IDP: () => IdentityProviders,
  },
};
</script>
