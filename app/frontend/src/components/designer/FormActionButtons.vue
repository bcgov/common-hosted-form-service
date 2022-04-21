<template>
  <v-container v-if="showFloatButtons">
    <v-row >
      <v-col>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-fade-transition v-bind="attrs" >
              <v-btn
                color="primary"
                dark
                bottom
                fixed
                x-small
                right
                fab 
                ripple
                v-bind="attrs"
                v-on="on"
                @click="submitFormSchema"
                class="formSubmit">
                <v-icon 
                  color="white"
                  small>
                  save
                </v-icon>
              </v-btn>
            </v-fade-transition>
          </template>
          <span>Save Design</span>
        </v-tooltip>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-fade-transition v-bind="attrs" >
              <v-btn
                color="primary"
                dark
                bottom
                fixed
                x-small
                right
                fab 
                ripple
                @click="onExportClick"
                v-bind="attrs"
                v-on="on"
                class="formExport">
                <v-icon 
                  color="white"
                  small>
                  get_app
                </v-icon>
              </v-btn>
            </v-fade-transition>
          </template>
          <span>Export Design</span>
        </v-tooltip>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-fade-transition v-bind="attrs" >
              <v-btn
                color="primary"
                dark
                bottom
                fixed
                x-small
                right
                fab
                @click="$refs.uploader.click()"
                v-bind="attrs"
                v-on="on" 
                class="formImport">
                <v-icon 
                  color="white"
                  small>
                  publish
                </v-icon>
                <input
                  class="d-none"
                  @change="loadFile"
                  ref="uploader"
                  type="file"
                  accept=".json"
                />
              </v-btn>
            </v-fade-transition>
          </template>
          <span>Import Design</span>
        </v-tooltip>
      </v-col>
    </v-row>

  </v-container>
</template>

<script>
export default {
  name:'FormActionButtons',
  data(){
    return{
      showFloatButtons:false
    };
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll);
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this.handleScroll);
  },
  methods: {
    handleScroll() {
      if(window.scrollY>320){
        this.showFloatButtons=true;
        return;
      }
      this.showFloatButtons=false;
    },
    scrollToTop(){
      window.scrollTo(0,0);
    },
    submitFormSchema(){
      this.$emit('form-schema-submit');
      this.scrollToTop();
    },
    onExportClick(){
      this.$emit('form-schema-export');
    },
    loadFile(event){
      this.$emit('load-form-schema',event);
    }
  }
};
</script>

<style>
  .formSubmit{
    margin-bottom:150px;
    margin-right:20px;
  }

  .formExport{
    margin-bottom:100px;
    margin-right:20px;
  }

  .formImport{
    margin-bottom:50px;
    margin-right:20px;
  }
</style>
