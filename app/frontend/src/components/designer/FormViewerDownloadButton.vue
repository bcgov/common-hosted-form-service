<template>
  <div class="file-upload">
    <div v-if="json_csv.data" class="download-box" >
      <p class="head-title">
        <v-icon color="primary" >information_outline</v-icon>
        <span>IMPORTANT!</span>
      </p>
      <div class="alert-text">
        In order to successfully complete bulk submissions, please download the instructions and the template.
        <span class="link">
          <vue-blob-json-csv
            tag-name="i"
            file-type="json"
            file-name="json_csv.file_name"
            title="Download   "
            :data="json_csv.data"
            confirm="Do you want to download it?"
          />
          <v-icon class='mr-1' color='#003366'>download</v-icon>
        </span>
      </div>
    </div>
    <h3>{{form.name}}</h3>

    <div v-if="!file" class="drop-zone" @click="handleFile" v-cloak @drop.prevent="addFile($event,0)" @dragover.prevent>
      <v-icon class="mr-1 " color="#003366">upload</v-icon>
      <h1>Select JSON file to upload </h1>
      <p>or drag and drop it here</p>
      <input class="drop-zone__input" ref="file" accept=".json" type="file" @change="addFile($event,1)" name="file" />
    </div>

    <div v-if="file" class="worker-zone">
      <div class="wz-top">
        <ProgressBar :value="value" :max="max" :error="error" />
      </div>
      <div class="wz-bottom">
        <div class="message-block" v-if="!progress" >
          <span>Report: </span>
          <p :class="txt_color">
            <v-icon v-if="error" color="red">close</v-icon>
            <v-icon v-if="!error" color="green">check</v-icon>
            {{ message }}
            <ul v-if="error && report.length>0" >
              <li></li>
            </ul>
          </p>
        </div>
        <hr v-if="error && report.length>0" />
        <div class="alert-text" v-if="error && report.length>0" >
          Please download the submission report and ensure that the data is entered correctly
          <span @click="downloadCsvFile()" class="link">Download report <v-icon class="mr-1 " color="#003366">
            download</v-icon>
          </span>
        </div>
      </div>
      <v-row v-if="file && !progress">
        <v-col cols="12" md="12">
          <span class="m-2 pull-right ">
            <v-btn @click="resetUpload" color="primary">
              <span>Upload new file</span>
            </v-btn>
          </span>
        </v-col>
      </v-row>
    </div>
   
  </div>
</template>
<script>
import {  mapActions,mapGetters } from 'vuex';
import exportFromJSON from 'export-from-json';
import ProgressBar from '@/components/designer/ProgressBar.vue';
// import { Formio } from 'formiojs';
export default {
  name: 'FormViewerDownloadButton',
  components: {
    ProgressBar
  },
  props: {
    formElement: undefined,
    form : {},
    formSchema: {},
    formFields: [],
    message: undefined,
    json_csv : {
      data: [],
      file_name: String
    }
  },
  data() {
    return {
      vForm:{},
      file: undefined,
      Json: [],
      content: [],
      parsed: false,
      value:0,
      max: 100,
      upload_state : 0,
      error: false,
      report : ['test'],
      index:0,
      globalError :[],
      progress: false
    };
  },
  computed: {
    ...mapGetters('auth', ['authenticated', 'token', 'tokenParsed', 'user']),
    txt_color(){
      if(!this.error) return 'success-text';
      else return 'fail-text';
    }
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    downloadCsvFile() {
      const data = this.json_csv.data;
      const fileName = this.json_csv.file_name;
      const exportType = exportFromJSON.types.csv;
      if (data) exportFromJSON({ data, fileName, exportType });
    },
    addFile(e,type) {
      if(this.file!=undefined) {
        this.addNotification({message:'Sorry, you can upload only one file.',consoleError: 'Only one file can be drag.',});
        return;
      }
      let droppedFiles = (type==0)?  e.dataTransfer.files : this.$refs.file.files;


      if(!droppedFiles) return;

      if(droppedFiles.length>1) {
        this.addNotification({message:'Sorry, you can drag only one file.',consoleError: 'Only one file can be drag.',});
        return;
      }
      this.file = droppedFiles [0];
      this.parseFile();
    },
    handleFile(){
      if(this.file==undefined) {
        this.$refs.file.click();
      }
    },
    removeFile(file){
      this.files = this.files.filter(f => {
        return f != file;
      });
    },
    parseFile(){
      try{
        let reader = new FileReader();
        reader.onload = function(e) {
          this.Json = JSON.parse(e.target.result);
        }.bind(this);
        reader.onloadend = () =>{
          this.preValidateSubmission();
        };
        reader.readAsText(this.file);
      }catch(e){
        this.addNotification({message:e,consoleError: e,});
      }
    },
    preValidateSubmission(){
      try {
        if(this.Json.length==0){ 
          this.addNotification({message:'this file is empty.',consoleError: 'this file is empty.'});
          return;
        }
        this.globalError = [];
        this.index = 0;
        this.max=100;
        this.progress = true;
        this.validate(this.Json[this.index]);
      } catch (error) {
        this.file = undefined;
        this.addNotification({message:'there is something wrong with this file',consoleError: error,});
        return;
      }
    
    },
    validate(element){
      
      const timer = setTimeout(function(){
        try {
          let validationResult =  this.formElement.checkValidity(element);
          console.log(validationResult);
          //let isvalid =   validationResult.valid;
          //const isVal = Formio.Utils.checkCondition(this.formElement.components, {}, element, true);
          if(!validationResult){
            this.globalError.push({
              index: this.index,
              errors:  validationResult.errors
            });
          }
        } catch (error) {
          this.addNotification({message:error,consoleError: error,});
        }
        this.index++;
        this.value = this.pourcentage(this.index);
        clearTimeout(timer);
        if(this.index < this.Json.length){
          this.validate(this.Json[this.index]);
        } else {
          this.endValidation();
        }
      }.bind(this), 500);
    },
    pourcentage(i){
      let ndata = this.Json.length;
      return Math.ceil((i * this.max) / ndata);
    },
    endValidation(){
      this.progress = false;
      console.log(this.globalError);
      if(this.globalError.length==0){
        this.report = this.globalError;
        this.error = false;
        this.$emit('save-bulk-data', this.Json );
      }
    },
    resetUpload(){
      this.globalError= [];
      this.file = undefined;
      this.Json = [];
      this.value = 0;
      this.upload_state = 0;
      this.error = false;
      this.report =  ['test'];
      this.index=0;
      this.globalError=[];
      this.progress= false;
      this.$emit('reset-message');
    }
  },
  created() {
  },
  beforeUpdate() {

  },
};
</script>

<style lang="scss" scoped>
.file-upload {
  position: relative;
  width: 100%;
  display: block;
  margin-top: 3%;
  // border: #003366 1px solid;
  .download-box {
    position: relative;
    width: 72%;
    min-height:64px;
    display: block;
    margin-bottom: 3%;
    border: 0.01px ridge #38598a;
    border-left: 30px solid #38598a;
    padding-left:0.5%;
    padding-top: 0.5%;
    padding-bottom: 0.5%;
    .link{
      color: #003366;
    }
    .head-title {
      width:100%;
      height: 30px;
      display: inline-block;
      padding:0%;
      margin: 0%;
      span {
        position:absolute;
        left:35px;
        text-align: left;
        font-size:13px;
        font-weight: 100;
        color:#003366;
        display: inline-block;
      }
      i {
        position:absolute;
        text-align: left;
        margin:none;
        padding:none;
        display: inline-block;
      }
    }
    .alert-text{
      width:100%;
      height: 30px;
      display: inline-block;
      padding:0%;
      margin: 0%;
      font-weight: 300;
      span {
        width:100%;
        font-size:14px;
        font-weight:bold;
        display: inline;
      }
    }

  }
  h3{
    color:#38598a;
  }
  .worker-zone {
    position: relative;
    max-width: 38%;
    min-height: 64px;
    padding: 0.05%;
    text-align: center;
    font-family: "Quicksand", sans-serif;
    font-size: 16px;
    border: 0.5px solid #003366;
    border-radius:10px;
    box-shadow: -4px 18px 126px -71px rgba(0,0,0,0.62);
    -webkit-box-shadow: -4px 18px 126px -71px rgba(0,0,0,0.62);
    -moz-box-shadow: -4px 18px 126px -71px rgba(0,0,0,0.62);
    .wz-top {
      width: 98%;
      min-height: 48px;
      margin-left: auto;
      margin-right: auto;
      display:inline-block;
      padding:0;
    }
    .wz-bottom {
      width: 98%;
      min-height: 48px;
      margin-left: auto;
      margin-right: auto;
      display:inline-block;
      text-align: left;
      margin-bottom: 0;
     .message-block {
      position: relative;
      width: 100%;
      display:inline-block;
      padding: 0;
      //border: 1px solid #003366;
      .success-text{
         color: #38598a;
      }
      .fail-text {
        color: rgb(233, 50, 78);
      }
      span {
        font-weight: bold;
        color:#003366;
        float: left;
        width: 12%;
        margin:0.5%;
        padding:none;
       }
        p {
         float: right;
         width: 84%;
         margin:0.5%;
         text-align: left;
         padding:0;
         i{
            margin: 0;
            padding:0;
         }
       }
      }
      hr {
        margin: none;
        margin-top: -0.5%;
        margin-bottom: -0.5%;
      }
      .alert-text{
        width:100%;
        height: 30px;
        display: inline-block;
        padding:0%;
        margin: 0%;
        font-weight: 300;
        span{
          font-size:14px;
          font-weight:bold;
          color: #38598a;
        }
      }
    }
  }
  .drop-zone {
    position: relative;
    max-width: 38%;
    min-height: 200px;
    padding: 3%;
    // display: flex;
   // align-items: center;
   // justify-content: center; -->
    text-align: center;
    font-family: "Quicksand", sans-serif;
    font-size: 17px;
    cursor: pointer;
    color: #cccccc;
    border: 1.5px dashed #053667;
    border-radius:10px;
    background-color : #EEF1FF;
    i{
      font-size:50px;
    }
    h1 {
      position: relative;
      width: 100%;
      text-align: center;
      font-size: 25px;
      font-weight: small;
      color: #003366;
      display: block;
    }
    p{
      position: relative;
      width: 100%;
      text-align: center;
      font-size: 15px;
      display: block;
      font-weight: bold;
    }
  }
  .drop-zone:hover{
    background-color : #d5d9ea;
  }
  .drop-zone--over {
    border-style: solid;
  }
  .drop-zone__input {
    display: none;
  }

}
</style>
