<script setup>
import { computed } from 'vue';
import FormDesigner from '~/components/designer/FormDesigner.vue';
import { IdentityProviders } from '~/utils/constants';

defineProps({
  d: {
    type: String,
    default: null,
  },
  f: {
    type: String,
    default: null,
  },
  sv: Boolean,
  v: {
    type: String,
    default: null,
  },
  svs: {
    type: String,
    default: null,
  },
  nv: {
    type: Boolean,
    default: false,
  },
});

const IDP = computed(() => IdentityProviders);

/* onMounted(() => {
  this.$refs.formDesigner.onFormLoad();
}); */
</script>

<template>
  <BaseSecure :idp="[IDP.IDIR]">
    <FormDesigner
      ref="formDesigner"
      class="mt-6"
      :draft-id="d"
      :form-id="f"
      :saved="JSON.parse(sv)"
      :version-id="v"
      :is-saved-status="svs"
      :new-version="nv"
    />
  </BaseSecure>
</template>
