<template>
  <v-row justify="center" class="mb-5">
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
          <v-row class="mt-8" no-gutters>
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
                    class="text-style"
                    color="#1A5A96"
                  >
                    {{moreHelpInfoLink}}
                  </v-text-field>
                </v-col>
                <v-checkbox
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
                    class="mr-4"
                    @click="submit"
                    :style="saveButtonWrapper"  
                  >
                    Save
                  </v-btn>
                  <v-btn
                    @click="onCloseDialog"
                    :style="cancelButtonWrapper"
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
  data(){
    return{
      componentName_:'',
      description:'',
      moreHelpInfoLink:'',
      isLinkEnabled:true,
      dialog: this.showDialog,
      color1:'#1A5A96',
      image:'',
      saveButtonWrapper:{
        background: '#003366 0% 0% no-repeat padding-box',
        border: '1px solid #707070',
        borderRadius: '3px',
        font: 'normal normal bold 18px Open Sans',
        letterSpacing: '0px',
        color: '#F2F2F2',
        width: '117px',
        height: '36px',
        textTransform: 'capitalize'
      },
      cancelButtonWrapper:{
        border: '1px solid #003366',
        background: '#FFFFFF 0% 0% no-repeat padding-box',
        borderRadius: '3px',
        font: 'normal normal bold 18px Open Sans',
        letterSpacing: '0px',
        color: '#38598A',
        width: '117px',
        height: '36px',
        textTransform: 'capitalize'
      },
    };
  },
  props:{
    showDialog:{ type: Boolean, required: true },
    component:{ type: Object },
    componentName:{type:String,require:true,default:''},
    groupName:{type:String,require:true}
  },
  methods:{
    ...mapActions('admin', ['addFormComponentHelpInfo','uploadFormComponentsHelpInfoImage']),
    onCloseDialog() {
      this.resetDialog();
      this.$emit('close-dialog');
    },
    async selectImage(image) {
      const reader = new FileReader();
      reader.onload=async(e)=> {
        this.image=e.target.result;
        await this.uploadFormComponentsHelpInfoImage({componentName:this.componentName_,image:this.image});
      };
      if(image) {
        await reader.readAsDataURL(image);
      }
    },

    submit() {
      this.addFormComponentHelpInfo({componentName:this.componentName_,imageUrl:this.fcHelpInfoImageUpload?this.fcHelpInfoImageUpload:this.component.imageUrl,moreHelpInfoLink:this.moreHelpInfoLink,version:this.version+1,
        groupName:this.groupName,description:this.description,status:this.component&&this.component.status?this.component.status:false});
      this.onCloseDialog();              
    },
    resetDialog() {
      this.description='';
      this.link='';
    },
    setPreviousVersion() {
      if(this.component){
        this.componentName_=this.component.componentName;
        this.description=this.component.description;
        this.moreHelpInfoLink=this.component.moreHelpInfoLink;
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
    text-decoration: underline;
    cursor:pointer;
  }
  .disabled{
    pointer-events: none;
  }
  .blueColorWrapper {
    text-align: left;
    font-style: normal;
    font-weight: normal;
    font-size: 18px;
    letter-spacing: 0px;
    color: #1A5A96;
    text-transform: capitalize;
  }
  .blackColorWrapper{
    text-align: left;
    text-decoration: underline;
    font-style: normal;
    font-weight: normal;
    font-size: 18px;
    color: #313132;
  }

  .v-label{
    text-align: left;
    text-decoration: none;
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
    color: #313132;
  }

  .blackColorWrapper{
    text-align: left;
    text-decoration: underline;
    font-style: normal;
    font-weight: normal;
    font-size: 18px;
    color: #313132;
  }
  
  .versionLabel{
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
  }
  .v-text-field input {
    font-style: normal;
    font-weight: normal;
    font-size: 18px;
    caret-color: #1A5A96;
    letter-spacing: 0px;
    color: #1A5A96 !important;
    border-bottom:1px solid #1A5A96;
  }
  .text-style textarea {
    text-align: left;
    font-style: normal;
    font-weight: normal;
    font-size: 18px;
    letter-spacing: 0px;
    caret-color: #1A5A96 !important;
    color: #1A5A96 !important;
    
  }
</style>
