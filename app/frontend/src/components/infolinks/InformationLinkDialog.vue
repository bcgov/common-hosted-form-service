<template>
  <v-row justify="center" class="mb-5">
    <v-dialog
      v-model="dialog"
      persistent
      width="60%"
    >
      <v-card>
        <v-container>
          <v-row>
            <v-col>
              <span class="text-h5">Common Component Information Link</span>
            </v-col>
          </v-row>
          <v-row class="mt-7" no-gutters>
            <span class="text-decoration-underline mr-2">
              Component Name:
            </span>
            <span class="blue--text text--darken-4">
              {{ item.name}}
            </span>
          </v-row>
          <v-row class="mt-5" no-gutters>
            <p class="mr-2 d-flex align-end text-decoration-underline blue--text text--darken-4">
              Learn More Links:
            </p>
            <v-col
              cols="6"
              sm="6"
            >
              <v-text-field
                dense
                style="width:80%;"
                v-model="link"
                value="link"
                class="light-blue--text"
              >
                {{link}}
              </v-text-field>
            </v-col>
          </v-row>
          
          <v-row class="mt-5" no-gutters>
            <v-col
              cols="12"
              sm="12"
              md="12"
            >
              Description
            </v-col>
            <v-col
              cols="12"
              sm="12"
              md="12"
            >
              <v-textarea
                
                clear-icon="mdi-close-circle"
                v-model="description"
                solo
                label="Solo"
                clearable
                value="description"
                class="light-blue--text"
              ></v-textarea>
            </v-col>
          </v-row>
          <v-row class="mt-5 " no-gutters>
            <span class="text-decoration-underline mr-2">
              Image Upload:
            </span>
            <span class="blue--text text--darken-4">
              <font-awesome-icon icon="fa-solid fa-cloud-arrow-up" size="2x" />
            </span>
          </v-row>
          <v-row class="mt-10" >
            <v-col>
              <div class="d-flex flex-row justify-space-between">
                <div>
                  <v-btn
                    class="mr-4"
                    color="primary"
                    @click="()=>{
                      //createSET_CCHelpLinksInfos({'tagName':item.name,imageLinks:this.link,version:this.description});
                      this.$emit('close-dialog');
                    }"
                  >
                    Save
                  </v-btn>
                  <v-btn
                    color="white"
                    @click="onCloseDialog"
                  >
                    Close
                  </v-btn>
                </div>
                <div class="d-flex flex-row">
                  <div class="mr-3"><span class="grey--text">Current:</span> <span class="font-weight-bold">Version 18</span></div>
                  <div color="grey--text">
                    <span class="grey--text">Version: 17</span> 
                    <span class="blue--text text--darken-4"> - </span>
                    <span class="blue--text text--darken-4 font-weight-medium" @mouseover="hover = true"
                          @mouseleave="hover = false"
                          :class="{ active: hover }">Restore
                    </span>
                  </div>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
//import { mapActions } from 'vuex';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
library.add(faCloudArrowUp);

export default {
  name:'InformationLinkDialog',
  data(){
    return{
      hover: false,
      description:'',
      link:'',
      dialog: this.showDialog
    };
  },
  props:{
    showDialog:{ type: Boolean, required: true },
    item:{ type: Object, required: true }
  },
  methods:{
    //...mapActions('admin', ['createSET_CCHelpLinksInfos']),
    onCloseDialog(){
      this.$emit('close-dialog');
    }
  },
  watch: {
    // `visible(value) => this.isVisible = value` could work too
    showDialog() {
      this.dialog = this.showDialog;
    }
  }
};
</script>
<style>
  .active {
    text-decoration: underline;
    cursor:pointer;
  }
</style>

