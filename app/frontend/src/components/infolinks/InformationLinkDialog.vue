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
              <span class="text-h5">Common Component Information Link</span>
            </v-col>
          </v-row>
          <v-row class="mt-7" no-gutters>
            <span class="text-decoration-underline mr-2 blackColorWrapper">
              Component Name:
            </span>
            <span v-text="name" class="blueColorWrapper"/>
          </v-row>
          <v-row class="mt-5" no-gutters>
            <div class="mt-2">
              <p class="mr-2 text-decoration-underline blueColorWrapper">
                Learn More Links:
              </p>
            </div>
            <div class="mt-1">
              <v-text-field
                dense
                style="width:80%;"
                v-model="link"
                flat
                value="link"
                class="text-style align-end"
                color="#1A5A96"
              >
                {{link}}
              </v-text-field>
            </div>
          </v-row>
          
          <v-row class="mt-5" no-gutters>
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
          <v-row class="mt-5 " no-gutters>
            <span class="text-decoration-underline mr-2 blackColorWrapper">
              Image Upload:
            </span>
            <span class="blue--text text--darken-4  d-flex align-end">
              <font-awesome-icon icon="fa-solid fa-cloud-arrow-up" size="xl" color='#1A5A96' />
            </span>
          </v-row>
          <v-row class="mt-10" >
            <v-col>
              <div class="d-flex flex-row justify-space-between">
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
import { mapActions } from 'vuex';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
library.add(faCloudArrowUp);

export default {
  name:'InformationLinkDialog',
  data(){
    return{
      name:'',
      description:'',
      link:'',
      dialog: this.showDialog,
      color1:'#1A5A96',
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
    item:{ type: Object },
    itemName:{type:String,require:true,default:''},
    groupName:{type:String,require:true}
  },
  methods:{
    ...mapActions('admin', ['addCommonCompsHelpInfo']),
    onCloseDialog(){
      this.resetDialog();
      this.$emit('close-dialog');
    },
    submit(){
      this.addCommonCompsHelpInfo({name:this.name,imageLink:'',link:this.link,version:this.version+1,
        groupName:this.groupName,description:this.description});
      this.onCloseDialog();              
    },
    resetDialog(){
      this.description='';
      this.link='';
      
    },
    setPreviousVersion(){
      if(this.item){
        this.name=this.item.name;
        this.description=this.item.description;
        this.link=this.item.link;
      }
    }
  },
  watch: {
    showDialog() {
      this.dialog = this.showDialog;
    },
    itemName(){
      this.name=this.itemName;
    }
  },
  computed: {
    version(){
      if(this.item) return this.item.version;
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

