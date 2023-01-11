<template>
  <v-row justify="center" class="mb-5" >
    <v-dialog
      v-model="dialog"
      persistent
      width="70%"
    >
      <v-card>
        <v-container>
          <v-row>
            <v-col>
              <span class="text-h5" style="font-weight:bold;">Component Information Link</span>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <p v-if="errors.length">
                <b>Please correct the following error(s):</b>
                <ul class="red--text">
                  <li v-for="(err, index) in errors" :key="index">{{ err }}</li>
                </ul>
              </p>
            </v-col>
          </v-row>
          <v-row class="mt-5" no-gutters>
            <span class="text-decoration-underline mr-2 blackColorWrapper">
              Component Name:
            </span>
            <span v-text="componentName_" class="blueColorWrapper"/>
          </v-row>
          <v-row class="mt-1" no-gutters>
            <v-col>
              <div class="d-flex flex-row align-center">
                <p class="mr-2 mt-2 text-decoration-underline blueColorWrapper">
                  Learn More Link:
                </p>
                <v-col cols="5">
                  <v-text-field
                    dense
                    enable
                    style="width:100%;"
                    v-model="moreHelpInfoLink"
                    flat
                    :disabled="isLinkEnabled"
                    :value="moreHelpInfoLink"
                    data-cy="more_help_info_link_text_field"
                    class="text-style"
                    color="#1A5A96"
                  >
                    {{moreHelpInfoLink}}
                  </v-text-field>
                </v-col>
                <v-checkbox
                  class="checkbox_data_cy"
                  @click="isLinkEnabled=!isLinkEnabled"
                >
                  <template v-slot:label>
                    <span class="v-label">{{isLinkEnabled?'Click to enable link':'Click to disable link'}}</span>
                  </template>
                </v-checkbox>
              </div>
            </v-col>
          </v-row>

          <v-row no-gutters>
            <v-col
              cols="12"
              sm="12"
              md="12"
              class="mb-2 blackColorWrapper"
            >
              Description
            </v-col>
            <v-col
              cols="12"
              sm="12"
              md="12"
            >
              <v-textarea
                clear-icon="mdi-close-circle"
                v-model="description"
                outlined
                hide-details
                clearable
                data-cy="more_help_info_link_text_area"
                value="description"
                class="text-style"
              ></v-textarea>
            </v-col>
          </v-row>
          <v-row class="mt-2 " no-gutters>
            <v-col>
              <div class="d-flex align-center">
                <font-awesome-icon icon="fa-solid fa-cloud-arrow-up" size="xl" color='#1A5A96' class="mr-1 mt-2"/>
                <v-col>
                  <v-file-input
                    style="width:50%;"
                    :prepend-icon="null"
                    show-size
                    counter
                    accept="image/*"
                    label="Image Upload:"
                    class="file_upload_data-cy"
                    @change="selectImage"
                  ></v-file-input>
                </v-col>
              </div>
            </v-col>
          </v-row>
          <v-row class="mt-10" >
            <v-col>
              <div class="d-flex flex-row justify-space-between align-end">
                <div>
                  <v-btn
                    class="mr-4 saveButtonWrapper"
                    @click="submit"
                    data-cy="more_help_info_link_save_button"
                  >
                    Save
                  </v-btn>
                  <v-btn
                    class="cancelButtonWrapper"
                    @click="onCloseDialog"
                    data-cy="more_help_info_link_cancel_button"
                  >
                    Cancel
                  </v-btn>
                </div>
                <div class="d-flex flex-row align-end versionLabel">
                  <div class="mr-3"><span style="color: #939393;">Current:</span> <span class="font-weight-bold" style="color: #313132;">Version {{version+1}}</span></div>
                  <div>
                    <span style="color: #707070C1;">Version: {{version}}</span>
                    <span style="color: #1A5A96;"> - </span>
                    <span style="color: #1A5A96;" class=" font-weight-medium active" :class="(version)===0?'disabled':''" @click="setPreviousVersion">Restore
                    </span>
                  </div>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>

import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
library.add(faCloudArrowUp);

import { mapActions,mapGetters } from 'vuex';


export default {
  name:'InformationLinkDialog',
  data() {
    return {
      errors: [],
      componentName_:'',
      description:'',
      moreHelpInfoLink:'',
      isLinkEnabled:true,
      dialog: this.showDialog,
      color1:'#1A5A96',
      image:'',

    };
  },
  props: {
    showDialog:{ type: Boolean, required: true },
    component:{ type: Object },
    componentName:{type:String,require:true,default:''},
    groupName:{type:String,require:true}
  },
  methods:{
    ...mapActions('admin', ['addFCProactiveHelp','uploadFCProactiveHelpImage']),
    onCloseDialog() {
      this.resetDialog();
      this.$emit('close-dialog');
    },
    async selectImage(image) {
      const reader = new FileReader();
      reader.onload=async(e)=> {

        this.image=e.target.result;
        //await this.uploadFormComponentsHelpInfoImage({componentName:this.componentName_,image:this.image});
      };
      if(image) {
        await reader.readAsDataURL(image);
      }
    },
    validateFields() {
      this.errors = [];
      let isError = false;
      if(this.componentName_==='') {
        this.errors.push('Name required.');
        isError=true;
      }

      if(this.image==='') {
        this.errors.push('Image required.');
        isError=true;
      }

      if(this.description==='') {
        this.errors.push('description required.');
        isError=true;
      }

      return isError;

    },

    submit() {
      if(!this.validateFields()) {
        this.addFCProactiveHelp({componentName:this.componentName_,image:this.image,externalLink:this.moreHelpInfoLink,version:this.version+1,
          groupName:this.groupName,description:this.description,status:this.component&&this.component.status?this.component.status:false});
        this.onCloseDialog();
      }
    },
    resetDialog() {
      this.description='';
      this.link='';
    },
    setPreviousVersion() {
      if(this.component){
        this.componentName_=this.component.componentName;
        this.description=this.component.description;
        this.moreHelpInfoLink=this.component.externalLink;
      }
    }
  },
  watch: {
    showDialog() {
      this.dialog = this.showDialog;
    },
    componentName() {
      this.componentName_=this.componentName;
    }
  },
  computed: {
    ...mapGetters('admin',['fcHelpInfoImageUpload']),
    version() {
      if(this.component) return this.component.version;
      return 0;
    }
  }
};
</script>
<style lang="scss" scoped>
  .active:hover {
    text-decoration: underline !important;
    cursor:pointer !important;
  }
  .disabled {
    pointer-events: none !important;
  }
  .blueColorWrapper {
    text-align: left !important;
    font-style: normal !important;
    font-size: 18px !important;
    font-family: BCSans !important;
    font-weight: normal !important;
    letter-spacing: 0px !important;
    color: #1A5A96 !important;

    text-transform: capitalize !important;
  }
  .blackColorWrapper {
    text-align: left !important;
    text-decoration: underline !important;
    font-style: normal !important;
    font-size: 18px !important;
    font-family: BCSans !important;
    font-weight: normal !important;
    color: #313132 !important;
  }

  .v-label {
    text-align: left !important;
    text-decoration: none !important;
    font-style: normal !important;
    font-size: 16px !important;
    font-family: BCSans !important;
    font-weight: normal !important;
    color: #313132 !important;
  }

  .blackColorWrapper {
    text-align: left !important;
    text-decoration: underline !important;
    font-style: normal !important;
    font-family: BCSans !important;
    font-weight: normal !important;
    font-size: 18px !important;
    color: #313132 !important;
  }

  .versionLabel {
    font-style: normal !important;
    font-family: BCSans !important;
    font-weight: normal !important;
    font-size: 16px !important;
  }
  .v-text-field input {
    font-style: normal !important;
    font-family: BCSans !important;
    font-weight: normal !important;
    font-size: 18px !important;
    caret-color: #1A5A96 !important;
    letter-spacing: 0px !important;
    color: #1A5A96 !important;
    border-bottom:1px solid #1A5A96 !important;
  }
  .text-style textarea {
    text-align: left !important;
    font-style: normal !important;
    font-family: BCSans !important;
    font-weight: normal !important;
    font-size: 18px !important;
    letter-spacing: 0px !important;
    caret-color: #1A5A96 !important;
    color: #1A5A96 !important;
  }
  .saveButtonWrapper {
    background: #003366 0% 0% no-repeat padding-box !important;
    border: 1px solid #707070;
    border-radius: 3px;
    font-style: normal !important;
    font-family: BCSans !important;
    font-weight: bold !important;
    font-size: 18px !important;
    letter-spacing: 0px !important;
    color: #F2F2F2;
    width: 117px;
    height: 36px;
    text-transform: capitalize;
  }
  .cancelButtonWrapper {
    border: 1px solid #003366 !important;
    background: #FFFFFF 0% 0% no-repeat padding-box !important;
    border-radius: 3px !important;
    font-style: normal !important;
    font-family: BCSans !important;
    font-weight: bold !important;
    font-size: 18px !important;
    letter-spacing: 0px !important;
    color: #38598A !important;
    width: 117px !important;
    height: 36px !important;
    text-transform: capitalize !important;
  }
</style>
