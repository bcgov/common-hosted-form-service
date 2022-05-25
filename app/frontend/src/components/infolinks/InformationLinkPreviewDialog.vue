<template>
  <v-row justify="center" class="mb-5">
    <v-dialog
      v-model="dialog"
      width="70%"
      persistent
    >
      <v-card class="pb-16">
        <v-container class="overflow-auto">
          <v-row >
            <v-col class="d-flex justify-space-between headerWrapper pa-4">
              <div class="align-self-center">{{item&&item.name}}</div>
              <div class="align-self-center cursor"><font-awesome-icon icon="fa-solid fa-xmark" :size="'1x'" inverse @click="()=>{
                //createSET_CCHelpLinksInfos({'tagName':item.name,imageLinks:this.link,version:this.description});
                this.$emit('close-dialog');
              }"/></div>
            </v-col>
          </v-row>
          <v-row class="mt-6" v-if="item&&item.imageLink">
            <v-col md="6" >
              <div class="text">
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
          <v-row class="mt-6" v-else>
            <v-col md="12" >
              <div class="text">
                {{item&&item.description}}
              </div>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="d-flex flex-row align-center text-decoration-underline linkWrapper">
              <a :href="item.link" :target="'_blank'"> <div class="mr-1 cursor" >Learn more 
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
<style lang="css">
  .cursor{
    cursor:pointer;
  }
  .text{
    font-style: normal;
    font-weight: normal;
    font-size: 18px;
    letter-spacing: 0px;
    color: #000000;
    opacity: 1;
  }
  .linkWrapper{
    text-align: left;
    text-decoration: underline;
    font-weight: normal;
    font-style: normal;
    font-size:18px;
    letter-spacing: 0px;
    color: #1A5A96;
  }
  .headerWrapper{
    height:40px;
    background: #1A5A96 0% 0% no-repeat padding-box;
    text-align: left;
    font-weight: normal;
    font-style: normal;
    font-size:25px;
    letter-spacing: 0px;
    color: #F2F2F2;
    text-transform: capitalize;
  }
</style>
