<template>
  <div class="mt-5">
    <v-expansion-panels flat class="nrmc-expand-collapse">
      <v-expansion-panel
        class="mb-1"
        flat
        v-for="(group, index) in groupList" :key="index"
        @click="onExpansionPanelClick(group)"
      >
        <v-expansion-panel-header class="panel" :style="panelHeadStyle.get(group)">
          <div class="header">
            <strong>{{group}}</strong>
          </div>
        </v-expansion-panel-header>
        <v-expansion-panel-content >
          <GeneralLayout :layoutList="groupComponentsList" :itemsList="ccHelpInfoList.basicLayout?ccHelpInfoList.basicLayout:[]"/>
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
      notActivePanelHead:{background: '#BFBDBD14 0% 0% no-repeat padding-box',
        border: '1px solid #7070703F'},
      activePanelHead:{background: '#F1F8FF 0% 0% no-repeat padding-box',
        border: '1px solid #7070703F'}
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
        this.panelHeadStyle.set(group,this.activePanelHead);
      }
      else{
        this.isPanelOpened.set(group,false);
        this.panelHeadStyle.set(group,this.notActivePanelHead);
      }

      for(let key of this.isPanelOpened.keys()){
        if(key!==group) {
          this.isPanelOpened.set(key,false);
          this.panelHeadStyle.set(key,this.notActivePanelHead);
        }
      }
    },
    extractGroups(){
      let allgroups=[];
      for (const key in this.builder) {
        if(this.isObject(this.builder[key])){
          if(this.builder[key].title){
            allgroups.push(this.builder[key].title);
            this.panelHeadStyle.set(this.builder[key].title,this.notActivePanelHead);
          } 
          
        }
      }
      return allgroups;
    },
    extractGroupComponents(group){
      let groupComponents = [];
      for (const key in this.builder) {
        if(this.isObject(this.builder[key])){
          if(this.builder[key].title===group && this.builder[key].components) 
          {
            for(let componentName of Object.keys(this.builder[key].components)){
              groupComponents.push({'name':componentName});
            }
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
<style>
  

.panel {
  font-weight: 600;
  font-family:Open Sans;
  font-style: normal;
  font-size: 16px;
  letter-spacing: 0px;
  color: #313132;
  text-transform: uppercase;
}


</style>
