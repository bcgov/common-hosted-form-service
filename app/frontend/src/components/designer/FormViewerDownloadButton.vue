<template>
  <div class="file-upload">
    <div v-if="json_csv.data" class="download-box" >
      <p class="head-title">
        <v-icon color="primary" >information_outline</v-icon>
        <span>IMPORTANT!</span>
      </p>
      <div class="alert-text">
        In order to successfully complete bulk submissions, please download the instructions and the template.
        <span @click="downloadCsvFile()" class="link">Download <v-icon class="mr-1 " color="#003366">download</v-icon></span>
      </div>
    </div>
    <h3>{{form.name}}</h3>
    <div class="drop-zone" v-cloak @drop.prevent="addFile" @dragover.prevent>
      <v-icon class="mr-1 " color="#003366">upload</v-icon>
      <h1>Select CSV file to upload </h1>
      <p>or drag and drop it here</p>
      <input class="drop-zone__input" type="file" name="files" id="file"/>
    </div>
  </div>
</template>
<script>
import {  mapActions,mapGetters } from 'vuex';
import exportFromJSON from 'export-from-json';
export default {
  name: 'FormViewerDownloadButton',
  components: {
  },
  props: {
    form : {},
    formSchema: {},
    formFields: [],
    json_csv : {
      data: String,
      file_name: String
    }
  },
  data() {
    return {
      file: []
    };
  },
  computed: {
    ...mapGetters('auth', ['authenticated', 'token', 'tokenParsed', 'user']),
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    downloadCsvFile() {
      const data = this.json_csv.data;
      const fileName = this.json_csv.file_name;
      const exportType = exportFromJSON.types.csv;
      if (data) exportFromJSON({ data, fileName, exportType });
    },
    addFile(e) {
      let droppedFiles = e.dataTransfer.files;
      if(!droppedFiles) return;

      if(droppedFiles.length>1) {
        this.addNotification({message:'Sorry, you can drag only one file.',consoleError: 'Only one file can be drag.',});
        return;
      }
      this.file = droppedFiles [0];
    },

    removeFile(file){
      this.files = this.files.filter(f => {
        return f != file;
      });
    },
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
  margin-top: 5%;
  // border: #003366 1px solid;
  .download-box{
    position: relative;
    width: 70%;
    min-height:80px;
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
        left:3.5%;
        text-align: left;
        font-size:15px;
        font-weight: 100;
        color:#003366;
      }
      i {
        position:absolute;
        text-align: left;
        margin:none;
        padding:none;
      }
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
      }
    }

  }
  h3{
    color:#38598a;
  }
  .drop-zone {
    position: relative;
    max-width: 40%;
    height: 200px;
    padding: 25px;
    // display: flex;
   // align-items: center;
   // justify-content: center; -->
    text-align: center;
    font-family: "Quicksand", sans-serif;
    font-size: 17px;
    cursor: pointer;
    color: #cccccc;
    border: 2px dashed #003366;
    border-radius:15px;
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
  .drop-zone--over {
    border-style: solid;
  }
  .drop-zone__input {
    display: none;
  }
  .drop-zone__thumb {
    width: 100%;
    height: 100%;
    border-radius: 10px;
    overflow: hidden;
    background-color: #cccccc;
    background-size: cover;
    position: relative;
  }
  .drop-zone__thumb::after {
    content: attr(data-label);
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 5px 0;
    color: #ffffff;
    background: rgba(0, 0, 0, 0.75);
    font-size: 14px;
    text-align: center;
  }
}
</style>
