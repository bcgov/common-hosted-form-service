<template>
  <div class="mt-5">
    <v-expansion-panels class="nrmc-expand-collapse" flat>
      <v-expansion-panel
        flat
        v-for="(group, index) in groupList" :key="index" 
        @click="onExpansionPanelClick(group)">
        <v-expansion-panel-header>
          <div class="header">
            <strong>{{group}}</strong>
          </div>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <GeneralLayout :groupName="group" 
                         :layoutList="groupComponentsList" 
                         :itemsList="ccHelpInfoList[group]?ccHelpInfoList[group]:[]"/>
        </v-expansion-panel-content>
      </v-expansion-panel> 
    </v-expansion-panels>
  </div>
</template>

<script>
import GeneralLayout from '@/components/infolinks/GeneralLayout.vue';
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'CommonComponentInfoLinks',
  components:{GeneralLayout},
  data(){
    return{
      isPanelOpened : new Map(),
      groupComponentsList:[],
      panelHeadStyle:new Map(),
    };
  },
  methods:{
    ...mapActions('admin',['listCommonCompsHelpInfo']),
    isObject(obj) {
      var type = typeof obj;
      return type === 'function' || (type === 'object' && !!obj);
    },


    onExpansionPanelClick(group) 
    {
      if(this.isPanelOpened.get(group)===undefined || !this.isPanelOpened.get(group))
      {
        this.isPanelOpened.set(group,true);
        this.groupComponentsList=this.extractGroupComponents(group);
      }
      else{
        this.isPanelOpened.set(group,false);
      }

      for(let key of this.isPanelOpened.keys()){
        if(key!==group) {
          this.isPanelOpened.set(key,false);
        }
      }
    },
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
    extractGroupComponents(group){
      let groupComponents = [];
      for (let  [, {title,components}] of Object.entries(this.builder)) {
        if((title && title===group) && components){
          for(let componentName of Object.keys(components)){
            groupComponents.push({'name':componentName});
          }
        }
      }
      return groupComponents;
    }
  },
  computed:{
    ...mapGetters('admin',['ccHelpInfo','ccHelpInfoList']),
    ...mapGetters('form', ['builder']),
    groupList(){
      return this.extractGroups();
    },

  },
  watch:{
    ccHelpInfo(){
      this.listCommonCompsHelpInfo();
    },
  },
  mounted(){
    this.listCommonCompsHelpInfo();
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
