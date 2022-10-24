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
      <template #title>Confirm Navigation</template>
      <template #icon>
        <v-icon large color="primary">help_outline</v-icon>
      </template>
      <template #text>
        <div class="dialogMessageText">
          You are about to navigate from this page. Do you want to keep this form?
        </div>
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
      await this.setIsSavedButtonClicked(true);
      this.showDialog=false;
      this.$router.push({name:this.toRouterPathName.trim()});

    },
  },
  beforeRouteLeave(_to, _from, next) {
    if(_to.name!==this.$route.name) {
      this.toRouterPathName = _to.name;
      !this.form.isSavedButtonClicked? this.showDialog=true: next();
    }
  },

};
</script>
<style lang="css" scoped>
  .dialogMessageText {
    color: #494949 !important;
    font-size: 17px;
    padding: 0;
  }
</style>
