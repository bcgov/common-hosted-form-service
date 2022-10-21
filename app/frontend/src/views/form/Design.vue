<template>
  <BaseSecure :idp="IDP.IDIR">
    <FormDesigner
      class="mt-6"
      :draftId="d"
      :formId="f"
      :saved="sv"
      :versionId="v"
    />
    <BaseDialog :value=this.showDialog type="SAVEDDELETE"
                @close-dialog="closeDialog"
                @delete-dialog="deleteDialog"
                @continue-dialog="navigateToRoute"
                :showCloseButton='true'>
      <template #title>Confirm Deletion</template>
      <template #icon>
        <v-icon large>info</v-icon>
      </template>
      <template #text>
        Do you want to keep this form?
      </template>
      <template #button-text-continue>
        <span>Keep</span>
      </template>
      <template #button-text-delete>
        <span>delete</span>
      </template>
    </BaseDialog>
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
  },
  data() {
    return {
      showDialog:false,
      toRouterPathName:''
    };
  },
  computed: {
    ...mapGetters('form', ['form']),
    IDP: () => IdentityProviders,
  },
  methods:{
    ...mapActions('form', ['deleteCurrentForm','setIsSavedButtonClicked']),
    closeDialog() {
      this.showDialog=false;
    },
    deleteDialog() {
      this.deleteCurrentForm();
      this.navigateToRoute();
    },
    async navigateToRoute() {
      this.showDialog=false;
      await this.setIsSavedButtonClicked(true);
      this.$router.push({name:this.toRouterPathName.trim()});
    },
  },
  mounted() {
    this.setIsSavedButtonClicked(false);
  },
  beforeRouteLeave(_to, _from, next) {
    if(_to.name!==this.$route.name) {
      this.toRouterPathName = _to.name;
      !this.form.isSavedButtonClicked? this.showDialog=true: next();
    }
    //next();
  },

};
</script>
