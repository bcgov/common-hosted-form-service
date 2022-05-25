<template>
  <div>
    <v-data-table
      class="submissions-table"
      :headers="headers"
      hide-default-header
      hide-default-footer
      :items="layoutList"
      :loading="loading"
      loading-text="Loading... Please wait"
    >
      <template #[`item.name`]="{ item}">
        <div>
          <template>
            <div style="text-transform: capitalize" class="labelStyling">{{ item.name }}</div>
          </template>
        </div>
      </template>
      <template #[`item.actions`]="{ item,index }">
        <div class="d-flex flex-row justify-end align-center actionsLabel">
          <div
          >
            <v-btn color="primary" class="labelStyling" text small @click="onOpenDialog(item.name)" >
              <font-awesome-icon icon="fa-solid fa-pen-to-square" />
              <span class="d-none d-sm-flex">EDIT</span>
            </v-btn>
          </div>
          <div>
            <v-btn color="primary" class="labelStyling" text small @click="onOpenPreviewDialog(item.name)" :disabled="canDisabled(item.name)">
              <font-awesome-icon icon="fa-solid fa-eye" />
              <span class="d-none d-sm-flex">PREVIEW</span>
            </v-btn>
          </div>
          <div>
            <v-btn color="primary" class="labelStyling" text small>
              <v-switch color="success" v-model="publish[index]" @change="onSwitchChange(index)"></v-switch>
              <span class="d-none d-sm-flex">{{ publish[index]?'PUBLISHED':'UNPUBLISHED'}}</span>
            </v-btn>
          </div>
        </div>
      </template>
    </v-data-table>
    <InformationLinkDialog :showDialog="showDialog"
                           :groupName="'basicLayout'" 
                           :itemName="itemName"
                           @close-dialog="onShowCloseDialog" 
                           :item="item"/>
    <InformationLinkPreviewDialog :showDialog="showPreviewDialog" 
                                  @close-dialog="onShowClosePreveiwDialog" 
                                  :item="item"/>
  </div>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPenToSquare,faEye } from '@fortawesome/free-solid-svg-icons';
import InformationLinkDialog from '@/components/infolinks/InformationLinkDialog.vue';
import InformationLinkPreviewDialog from '@/components/infolinks/InformationLinkPreviewDialog.vue';

library.add(faPenToSquare,faEye);

export default{
  name: 'GeneralLayout',
  components:{InformationLinkDialog,InformationLinkPreviewDialog},
  data(){
    return{
      loading:false,
      showDialog:false,
      showPreviewDialog:false,
      publish:[],
      publishStatus:'UNPUBLISHED',
      itemName:'',
      item:{},
      listLength:this.itemsList.length,
      headers: [
        { text: 'Form Title', align: 'start', value: 'name', width: '1%', },
        {
          text: 'Actions',
          align: 'end',
          value: 'actions',
          filterable: false,
          sortable: false,
          width: '1%',
        },
      ],
    };
  },
  
  props:{
    layoutList:{
      type:Array,
      required: true
    },
    itemsList:{
      type:Array,
      defualt:[]
    }
  },
  methods:{
    onShowCloseDialog(){
      this.showDialog= !this.showDialog;
    },
    onShowClosePreveiwDialog(){
      this.showPreviewDialog=!this.showPreviewDialog;
    },
    canDisabled(itemName){
      return this.itemsList.filter(item => item.name === itemName ).length == 0; 
    }, 
    onOpenDialog(itemName){
      this.getItem(itemName);
      this.onShowCloseDialog();
    },
    onOpenPreviewDialog(itemName){
      this.getItem(itemName);
      this.onShowClosePreveiwDialog();
    },
    getItem(itemName){
      if(itemName){
        this.itemName=itemName;
        this.item =this.itemsList.find(obj => {
          return obj.name === this.itemName;
        });
      }
    },

    onSwitchChange(){
      
    }
   
  }
};
</script>
<style lang="scss">
  .labelStyling{
    text-align: left;
    font: normal normal normal 18px;
    letter-spacing: 0px;
    color: #003366;
  }
  .actionsLabel > div{
    border-left: 1px solid #7070703F;
    width: 130px;
    display:flex;
    justify-content: center;
  }

  .actionsLabel> div:last-child{
    border-left: 1px solid #7070703F;
    width: 190px;
    display:flex;
    justify-content: center;
  }

  
</style>
