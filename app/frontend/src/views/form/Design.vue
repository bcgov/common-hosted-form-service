<template>
  <BaseSecure :idp="IDP.IDIR">
    <FormDesigner
      class="mt-6"
      :draftId="d"
      :formId="f"
      :saved="sv"
      :versionId="v"
      ref="formDesigner"
    />
  </BaseSecure>
</template>

<script>
import { mapGetters,mapActions } from 'vuex';

import FormDesigner from '@/components/designer/FormDesigner.vue';
import { IdentityProviders } from '@/utils/constants';
import admin from '@/store/modules/admin.js';
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
  },
  mounted() {
    this.listCommonCompsHelpInfo();
    this.$nextTick(() => {
      this.$refs.formDesigner.onFormLoad();
    });
  },
  methods:{
    ...mapActions('admin', ['listCommonCompsHelpInfo']),
  },
  computed: {
    ...mapGetters('form', ['form']),
    IDP: () => IdentityProviders,
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
  beforeMount(){
    if(!this.$store.hasModule('admin')) {
      this.$store.registerModule('admin', admin);
    }
    this.listCommonCompsHelpInfo();
  },
  beforeUnmount(){
    if (this.$store.hasModule('admin')) {
      this.$store.unregisterModule('admin');
    }

  },
};
</script>
