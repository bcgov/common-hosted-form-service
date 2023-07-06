<script>
import { mapActions, mapState } from 'pinia';
import { nextTick } from 'vue';
import BaseSecure from '~/components/base/BaseSecure.vue';
import FormDesigner from '~/components/designer/FormDesigner.vue';
import { useFormStore } from '~/store/form';
import { IdentityProviders } from '~/utils/constants';

export default {
  components: {
    BaseSecure,
    FormDesigner,
  },
  beforeRouteLeave(_to, _from, next) {
    this.form.isDirty
      ? next(
          window.confirm(
            'Do you really want to leave this page? Changes you made will not be saved.'
          )
        )
      : next();
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
  },
  computed: {
    ...mapState(useFormStore, ['form']),
    IDP: () => IdentityProviders,
  },
  mounted() {
    nextTick(() => {
      this.onFormLoad();
    });
  },
  beforeMount() {
    this.listFCProactiveHelp();
  },
  methods: {
    ...mapActions(useFormStore, ['listFCProactiveHelp', 'deleteCurrentForm']),
    onFormLoad() {
      this.$refs.formDesigner.onFormLoad();
    },
  },
};
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
