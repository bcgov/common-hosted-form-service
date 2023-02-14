<template>
  <BaseSecure :idp="IDP.IDIR">
    <FormDesigner
      class="mt-6"
      :draftId="d"
      :formId="f"
      :saved="JSON.parse(sv)"
      :versionId="v"
      ref="formDesigner"
      :isSavedStatus="svs"
      :newVersion="nv"
    />
  </BaseSecure>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import FormDesigner from '@/components/designer/FormDesigner.vue';
import { IdentityProviders } from '@/utils/constants';

export default {
  name: 'FormDesign',
  components: {
    FormDesigner,
  },
  props: {
    d: String,
    f: String,
    sv: Boolean,
    v: String,
    svs:String,
    nv:{
      type:Boolean,
      default:false
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.$refs.formDesigner.onFormLoad();
    });
  },

  methods:{
    ...mapActions('form', ['listFCProactiveHelp','deleteCurrentForm']),
  },
  computed: {
    ...mapGetters('form', ['form']),
    IDP: () => IdentityProviders,
  },
  beforeRouteLeave(_to, _from,next) {
    this.form.isDirty
      ? next(
        window.confirm(
          'Do you really want to leave this page? Changes you made will not be saved.'
        )
      )
      : next();
  },
  beforeMount() {
    this.listFCProactiveHelp();
  },
};
</script>
