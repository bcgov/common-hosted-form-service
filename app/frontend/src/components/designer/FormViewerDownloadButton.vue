<template>
  <div class="file-upload">
    <div v-if="json_csv.data" class="download-box" >
      Please download the last template <p @click="downloadCsvFile()" class="link">  {{ json_csv.file_name+'.csv'}}</p>
    </div>
    <div class="drop-zone" v-cloak @drop.prevent="addFile" @dragover.prevent>
      <p>Please drag your csv file here</p>
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
  display: inline-block;
  // border: #003366 1px solid;
  .download-box{
    position: relative;
    width: 50%;
    display: inline-block;
    margin-bottom: 1%;
    float: left;
    .link{
      color: #003366;
    }
  }
  .drop-zone {
    max-width: 50%;
    height: 120px;
    padding: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-family: "Quicksand", sans-serif;
    font-weight: 500;
    font-size: 20px;
    cursor: pointer;
    color: #cccccc;
    border: 4px dashed #003366;
    border-radius: 10px;
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
