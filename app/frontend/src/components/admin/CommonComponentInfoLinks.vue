<template>
  <div class="mt-5">
    <v-expansion-panels flat
                        class="nrmc-expand-collapse">
      <v-expansion-panel
        flat
      >
        <v-expansion-panel-header>
          <div class="header">
            <strong>Basic Layout</strong>
          </div>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <BasicLayout :layoutList="basicLayoutList"/>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
import BasicLayout from '@/components/infolinks/BasicLayout.vue';


export default {
  name: 'CommonComponentInfoLinks',
  components:{BasicLayout},
  data(){
    return{
      basicLayoutList:[
        {name:'Basic Layout'},
        {name:'Text/Images'},
        {name:'Columns-2'},
        {name:'Columns-3'},
        {name:'Columns-4'},
        {name:'Tabs'},
        {name:'Panel'}
      ]
    };
  }
  
};
</script>
