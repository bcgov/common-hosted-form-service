<template>
  <BaseSecure :idp="IDP.IDIR">
    <FormDesigner
      class="mt-6"
      :draftId="d"
      :formId="f"
      :saved="JSON.parse(sv)"
      :versionId="v"
      :newForm="JSON.parse(nf)"
      :autosave="JSON.parse(as)"
    />
    <BaseDialog :value=Boolean(this.showDialog) type="SAVEDDELETE"
                @close-dialog="closeDialog"
                @delete-dialog="deleteDialog"
                @continue-dialog="navigateToRoute"
                :showCloseButton=true>
      <template #title>Confirm</template>
      <template #text>
        <div class="dialogMessageText">
          Do you want to save this form before exiting?
        </div>
      </template>
      <template #button-text-continue>
        <span>Yes</span>
      </template>
      <template #button-text-delete>
        <span>No</span>
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
    nf:Boolean,
    as:{
      default:false
    }
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
      this.onDeleteDialogCheck();
    },
    async onDeleteDialogCheck() {

      this.showDialog=false;
      await this.setShowWarningDialog(false);
      await this.setCanLogout(true);
      //checks if form designers is trying to log out without
      //clicking on the save button
      if(this.isLogoutButtonClicked){
        this.logoutWithUrl();
      }
      if(this.toRouterPathName==='FormManage') {

        this.$router.push({name:'UserForms'});
      }
      else {
        this.$router.push({name:this.toRouterPathName.trim()});
      }
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
    beforeRouteLeave(_to, _from,next) {
      this.form.isDirty
        ? next(
          window.confirm(
            'Do you really want to leave this page? Changes you made will not be saved.'
          )
        )
        : next();
      // part of autosave faature
      /*
      //if not the same route, and showWarningDialog is true
      // it will ask form designers if they want to delete or
      //or keep the forms
      if(_to.name!==_from.name) {
        this.toRouterPathName = _to.name;
        this.showWarningDialog? this.showDialog=true: next();
      }
      */
    },
  },



};
</script>
