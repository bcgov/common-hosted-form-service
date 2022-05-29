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
            <div style="text-transform: capitalize" :style="label">{{ item.name }}</div>
          </template>
        </div>
      </template>
      <template #[`item.actions`]="{ item,index }">
        <div class="d-flex flex-row justify-end align-center actions">
          <div>
            <v-btn color="primary" small text @click="onOpenDialog(item.name)">
              <font-awesome-icon icon="fa-solid fa-pen-to-square" />
              <span class="d-none d-sm-flex" style="font-size:16px;">EDIT</span>
            </v-btn>
          </div>
          <div>
            <v-btn color="primary" text small
                   @click="onOpenPreviewDialog(item.name)" 
                   :disabled="canDisabled(item.name)" >
    
              <font-awesome-icon icon="fa-solid fa-eye" />
              <span class="d-none d-sm-flex" style="font-size:16px;">PREVIEW</span>
            </v-btn>
          </div>
          <div>
            <v-btn color="primary" text small :disabled="canDisabled(item.name)">
              <v-switch small color="success" :input-value="isComponentPublish(item.name,index)" v-model="publish[index]" @change="onSwitchChange(item.name,index)"></v-switch>
              <span class="d-none d-sm-flex" style="font-size:16px;">{{ publish[index]?'PUBLISHED':'UNPUBLISHED'}}</span>
            </v-btn>
          </div>
        </div>
      </template>
    </v-data-table>
    <InformationLinkDialog :showDialog="showDialog"
                           :groupName="groupName" 
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
import { mapActions } from 'vuex';
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
      label:{
        textAlign: 'left',
        fontWeight: 'normal', 
        fontStyle:'normal',
        fontSize:'18px',
        color: '#003366'
      }
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
    },
    groupName:String
  },
  methods:{
    ...mapActions('admin', ['updateCommonCompsHelpInfoStatus']),
    onShowCloseDialog(){
      this.showDialog= !this.showDialog;
    },
    onShowClosePreveiwDialog(){
      this.showPreviewDialog=!this.showPreviewDialog;
    },
    canDisabled(itemName){
      return this.itemsList.filter(item => item.name === itemName ).length == 0; 
    }, 
    isComponentPublish(componentName,index){
      for(let component of this.itemsList){
        if(component.name===componentName){
          this.publish[index]=component.status;
        }
      }
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

    onSwitchChange(componentName, index){
      for (const component of this.itemsList) {
        if(component.name===componentName){
          this.updateCommonCompsHelpInfoStatus({
            componentId:component.id, 
            publishStatus:this.publish[index]
          });
        } 
      }
    }
   
  }
};
</script>
<style lang="css" scoped>
  .submissions-table >>> tbody tr {
    background: #BFBDBD14;
    border: 1px solid #7070703F;
    margin-bottom: 35px;
    border-spacing: 15px 50px;
  }
  
  .actions > div{
    border-left: 1px solid #7070703F;
    padding-left:10px;
    padding-right:10px;
    display:flex;
    justify-content: center;
  }
  

  .actions > div:last-child{
    border-left: 1px solid #7070703F;
    width: 240px;
    display:flex;
    justify-content: center;
  } 
  
</style>
