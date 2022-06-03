<template>
  <div class="mt-5">
    <v-expansion-panels class="nrmc-expand-collapse" flat>
      <v-expansion-panel
        flat
        v-for="(groupName, index) in groupList" :key="index" 
        @click="onExpansionPanelClick(groupName)">
        <v-expansion-panel-header>
          <div class="header">
            <strong>{{groupName}}</strong>
          </div>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <GeneralLayout :groupName="groupName" 
                         :layoutList="groupComponentsList" 
                         :componentsList="fcHelpInfoGroupObject[groupName]?fcHelpInfoGroupObject[groupName]:[]"/>
        </v-expansion-panel-content>
      </v-expansion-panel> 
    </v-expansion-panels>
  </div>
</template>

<script>
import GeneralLayout from '@/components/infolinks/GeneralLayout.vue';
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'FormComponentsHelpInfo',
  components:{GeneralLayout},
  data(){
    return{
      isPanelOpened : new Map(),
      groupComponentsList:[],
      panelHeadStyle:new Map(),
    };
  },
  methods:{
    ...mapActions('admin',['listFormComponentsHelpInfo']),
    isObject(obj) {
      var type = typeof obj;
      return type === 'function' || (type === 'object' && !!obj);
    },


    onExpansionPanelClick(groupName) 
    {
      if(this.isPanelOpened.get(groupName)===undefined || !this.isPanelOpened.get(groupName))
      {
        this.isPanelOpened.set(groupName,true);
        this.groupComponentsList=this.extractGroupComponents(groupName);
      }
      else{
        this.isPanelOpened.set(groupName,false);
      }

      for(let key of this.isPanelOpened.keys()){
        if(key!==groupName) {
          this.isPanelOpened.set(key,false);
        }
      }
    },

    //extract form builder layout groups.
    extractGroups(){
      let allgroups=[];
      for (let  [, {title}] of Object.entries(this.builder)) {
        if(title){
          allgroups.push(title);
          this.panelHeadStyle.set(title,this.notActivePanelHead);
        } 
      }
      return allgroups;
    },

    //extract all components in the select group in form builder
    extractGroupComponents(groupName){
      let groupComponents = [];
      for (let  [, {title,components}] of Object.entries(this.builder)) {
        if((title && title===groupName) && components){
          for(let componentName of Object.keys(components)){
            groupComponents.push({'componentName':componentName});
          }
        }
      }
      return groupComponents;
    }
  },
  computed:{
    ...mapGetters('admin',['fcHelpInfo','fcHelpInfoGroupObject']),
    ...mapGetters('form', ['builder']),
    groupList(){
      return this.extractGroups();
    },

  },
  watch:{
    fcHelpInfo(){
      this.listFormComponentsHelpInfo();
    },
  },
  mounted(){
    this.listFormComponentsHelpInfo();
  }
};
</script>

<style lang="scss" scoped>
// Customized expand/collapse section
.nrmc-expand-collapse {
  min-height: 50px;
  .v-expansion-panel--active > .v-expansion-panel-header {
    min-height: 50px;
    background: #F1F8FF;
  }

  .v-expansion-panel-header {
    padding: 10px;
    background: #BFBDBD14;
    border: 1px solid #7070703F;
    
    .header {
      font-weight:normal;
      font-style: normal;
      font-family: BCSans !important;
      font-size: 18px;
      color: #313132;
    }
    
    &:hover{
      background: #F1F8FF;
      
    }
  }

  .v-expansion-panel:not(.v-expansion-panel--active) {
    margin-bottom: 5px;
  }

  .v-expansion-panel-header:hover {
    background: '#F1F8FF';
  }

  .v-expansion-panel-content__wrap {
    padding-top: 8px;
    padding-bottom:0px !important;
  }
}
</style>
