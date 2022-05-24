<template>
  <div class="mb-5 ">
    <v-data-table
      class="submissions-table"
      :headers="headers"
      hide-default-header
      hide-default-footer
      :items="layoutList"
      :loading="loading"
      loading-text="Loading... Please wait"
    >
      <template #[`item.name`]="{ item }">
        <div>
          <template>
            <span>{{ item.name }}</span>
          </template>
        </div>
      </template>
      <template #[`item.actions`]="{ item }">
        <div class="d-flex flex-row justify-end align-center">
          <div
          >
            <v-btn color="primary" text small @click="onOpenDialog(item.name)" >
              <font-awesome-icon icon="fa-solid fa-pen-to-square" />
              <span class="d-none d-sm-flex">EDIT</span>
            </v-btn>
          </div>
          <div>
            <v-btn color="primary" text small @click="onOpenPreviewDialog(item.name)" :disabled="canDisabled(item.name)">
              <font-awesome-icon icon="fa-solid fa-eye" />
              <span class="d-none d-sm-flex">PREVIEW</span>
            </v-btn>
          </div>
          <div>
            <v-btn color="primary" text small>
              <v-switch v-model="publish"></v-switch>
              <span class="d-none d-sm-flex">UNPUBLISHED</span>
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
      publish:'',
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
   
  }
};
</script>
