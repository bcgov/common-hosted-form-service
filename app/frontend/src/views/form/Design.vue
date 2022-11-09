<template>
  <BaseSecure :idp="IDP.IDIR">
    <FormDesigner
      class="mt-6"
      :draftId="d"
      :formId="f"
      :saved="Boolean(sv)"
      :versionId="v"
      :newForm="Boolean(nf)"
    />
    <BaseDialog :value=Boolean(this.showDialog) type="SAVEDDELETE"
                @close-dialog="closeDialog"
                @delete-dialog="deleteDialog"
                @continue-dialog="navigateToRoute"
                :showCloseButton=true>
      <template #title>Confirm</template>
      <template #icon>
        <v-icon large color="primary">warning</v-icon>
      </template>
      <template #text>
        <div class="dialogMessageText">
          Do you want to save this form?
        </div>
      </template>
      <template #button-text-continue>
        <span>Save</span>
      </template>
      <template #button-text-delete>
        <span>Delete</span>
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
    nf:Boolean
  },
  data() {
    return {
      showDialog:false,
      toRouterPathName:''
    };
  },

  computed: {
    ...mapGetters('form', ['form','isLogoutButtonClicked','showWarningDialog','canLogout']),
    IDP: () => IdentityProviders,
  },
  watch: {
    isLogoutButtonClicked(){
      this.showDialog=true;
    },
  },
  methods:{
    ...mapActions('form', ['deleteCurrentForm','setIsLogoutButtonClicked','setShowWarningDialog','setCanLogout']),
    ...mapActions('auth', ['logoutWithUrl']),
    async closeDialog() {
      await this.setIsLogoutButtonClicked(false);
      this.showDialog=false;
    },
    deleteDialog() {
      this.deleteCurrentForm();
      this.navigateToRoute();
    },
    async navigateToRoute() {
      this.showDialog=false;
      await this.setShowWarningDialog(false);
      await this.setCanLogout(true);
      //checks if form designers is trying to log out without
      //clicking on the save button
      if(this.isLogoutButtonClicked){
        this.logoutWithUrl();
      }
      this.$router.push({name:this.toRouterPathName.trim()});
    },
  },
  beforeRouteLeave(_to, _from,next) {
    //if not the same route, and showWarningDialog is true
    // it will ask form designers if they want to delete or
    //or keep the forms
    if(_to.name!==_from.name) {
      this.toRouterPathName = _to.name;
      this.showWarningDialog? this.showDialog=true: next();
    }
  },

};
</script>
<style lang="css" scoped>
  .dialogMessageText {
    color: #494949 !important;
    font-size: 19px;
    line-height: 30px;
    padding: 0;
  }
</style>
