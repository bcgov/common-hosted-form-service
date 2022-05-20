<template>
  <v-row justify="center" class="mb-5">
    <v-dialog
      v-model="dialog"
      width="800"
      persistent
    >
      <v-card class="pb-16">
        <v-container class="overflow-auto">
          <v-row >
            <v-col class="d-flex justify-space-between indigo darken-1" style="height:40px;" >
              <div class="align-self-center text-subtitle-1 white--text">{{item&&item.name}}</div>
              <div class="align-self-center cursor"><font-awesome-icon icon="fa-solid fa-xmark" size="lg" inverse @click="()=>{
                //createSET_CCHelpLinksInfos({'tagName':item.name,imageLinks:this.link,version:this.description});
                this.$emit('close-dialog');
              }"/></div>
            </v-col>
          </v-row>
          <v-row class="mt-6">
            <v-col md="6" >
              <div>
                {{item&&item.description}}
              </div>
            </v-col>
            <v-col md="6" >
              <v-img
                :lazy-src="item&&item.imageLink"
                :src="item&&item.imageLink"
              ></v-img>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="d-flex flex-row align-center text-decoration-underline blue--text text--darken-4">
              <a :href="'https://www.google.com/'" :target="'_blank'"> <div class="mr-1 cursor" >Learn more 
                <font-awesome-icon icon="fa-solid fa-square-arrow-up-right" /> </div></a>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>
  </v-row>
</template>
<script>

import { library } from '@fortawesome/fontawesome-svg-core';
import { faXmark,faSquareArrowUpRight } from '@fortawesome/free-solid-svg-icons';
library.add(faXmark,faSquareArrowUpRight);

export default {
  name:'InformationLinkPreviewDialog',
  data () {
    return {
      dialog: this.showDialog
    };
  },
  props:{
    showDialog:{ type: Boolean, required: true },
    item:{ type: Object }
  },
  methods:{
    onCloseDialog(){
      this.$emit('close-dialog');
    }
  },
  
  watch: {
    // `visible(value) => this.isVisible = value` could work too
    showDialog() {
      this.dialog = this.showDialog;
    },
  },
};
</script>
<style>
  .cursor{
    cursor:pointer;
  }
</style>
