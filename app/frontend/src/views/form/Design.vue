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

<script>
import { nextTick } from 'vue';
import { mapGetters, mapActions } from 'vuex';
import FormDesigner from '@/components/designer/FormDesigner.vue';
import { IdentityProviders } from '@/utils/constants';

export default {
  name: 'FormDesign',
  components: {
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
    d: String,
    f: String,
    sv: Boolean,
    v: String,
    svs: String,
    nv: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...mapGetters('form', ['form']),
    IDP: () => IdentityProviders,
  },
  mounted() {
    nextTick(() => {
      this.$refs.formDesigner.onFormLoad();
    });
  },
  beforeMount() {
    this.listFCProactiveHelp();
  },
  methods: {
    ...mapActions('form', ['listFCProactiveHelp', 'deleteCurrentForm']),
  },
};
</script>
