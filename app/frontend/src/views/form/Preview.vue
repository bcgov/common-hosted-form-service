<script>
import { mapState } from 'pinia';
import BaseSecure from '~/components/base/BaseSecure.vue';
import FormViewer from '~/components/designer/FormViewer.vue';

import { useFormStore } from '~/store/form';
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
    ...mapState(useFormStore, ['isRTL', 'lang']),
    IDP: () => IdentityProviders,
  },
};
</script>

<template>
  <BaseSecure :idp="[IDP.IDIR]">
    <h1
      :class="{ 'dir-rtl': isRTL }"
      :lang="lang"
      style="text-align: left !important"
    >
      {{ $t('trans.preview.preview') }}
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-icon
            color="primary"
            class="mt-n1 ml-1"
            v-bind="props"
            icon="mdi:mdi-help-circle-outline"
          />
        </template>
        <span :lang="lang">
          {{ $t('trans.preview.previewToolTip') }}
        </span>
      </v-tooltip>
    </h1>
    <FormViewer :draft-id="d" :form-id="f" preview :version-id="v" />
  </BaseSecure>
</template>
