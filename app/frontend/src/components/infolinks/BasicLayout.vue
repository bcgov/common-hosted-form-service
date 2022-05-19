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
            <v-btn color="primary" text small @click="onShowDialog(item)">
              <font-awesome-icon icon="fa-solid fa-pen-to-square" />
              <span class="d-none d-sm-flex">Edit</span>
            </v-btn>
          </div>
          <div>
            <v-btn color="primary" text small>
              <font-awesome-icon icon="fa-solid fa-eye" />
              <span class="d-none d-sm-flex">Preview</span>
            </v-btn>
          </div>
          <div>
            <v-btn color="primary" text small>
              <v-switch v-model="publish"></v-switch>
              <span class="d-none d-sm-flex">Published</span>
            </v-btn>
          </div>
        </div>
      </template>
    </v-data-table>"
    <InformationLinkDialog :showDialog="showDialog" 
                           @close-dialog="onShowDialog" 
                           :item="item"/>
  </div>
</template>

<script>

import { library } from '@fortawesome/fontawesome-svg-core';
import { faPenToSquare,faEye } from '@fortawesome/free-solid-svg-icons';
import InformationLinkDialog from '@/components/infolinks/InformationLinkDialog.vue';

library.add(faPenToSquare,faEye);

export default{
  name: 'BasicLayout',
  components:{InformationLinkDialog},
  data(){
    return{
      loading:false,
      showDialog:false,
      publish:'',
      item:{},
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
    }
  },
  methods:{
    onShowDialog(item){
      if(item) this.item=item;
      this.showDialog= !this.showDialog;
      
    }
  }
};
</script>
