<template>
  <span>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <span v-bind="attrs" v-on="on">
          <v-btn
            class="mx-1"
            data-cy="viewColumnPreferences"
            @click="openPrefs()"
            color="primary"
            :disabled="!canSetColumnPrefs"
            icon
          >
            <v-icon>view_column</v-icon>
          </v-btn>
        </span>
      </template>
      <span v-if="canSetColumnPrefs">Select Columns</span>
      <span v-else>No published form version</span>
    </v-tooltip>

    <v-dialog v-model="dialog" width="700">
      <v-card>
        <v-card-title class="text-h5 pb-0 titleWrapper" >Search and select fields to show under your dashboard</v-card-title>
        <v-card-subtitle class="mt-1 d-flex subTitleWrapper">
          <font-awesome-icon icon="fa-solid fa-circle-info" class="mt-1" color="#003366A1" />
          <!-- <span>To export selected data go to: <v-icon>get_app</v-icon>export submissions</span>-->

        </v-card-subtitle>
        <v-card-text style="padding-top:0px;margin-top:0px;">
          <hr style="height: 1px; border: none;background-color:#707070C1;margin-bottom:0px">

          <div class="d-flex flex-row align-center" style="gap:30px;">
            <div class="d-flex flex-row align-center searchField">
              <font-awesome-icon icon="fa-magnifying-glass" style="font-size:16px; color:#000000;"/>
              <div class="d-flex flex-row align-center justify-space-between" style="width:100%;">
                <input type="search" :placeholder="searchPlaceOrder"
                       @focus="()=>{searchPlaceOrder=''}"
                       @blur="()=>{searchPlaceOrder='Search form fields'}"
                       v-model="onSearchInputChange">
                <font-awesome-icon icon="fa-solid fa-circle-xmark" color="#003366A1" class="fa-sm clearButton" :style="{display:isClearButtonDisplay, marginRight:'5px'}" @click="onInputSearchClear"/>
              </div>
            </div>
            <v-checkbox class="checkbox" data-cy="selectAll-checkbox" v-model="selectedAll" :style="{pointerEvents:selectAllPointerEvent}" @change="onSelectAllCheckboxChange">
              <template v-slot:label>
                <span class="checkboxLabel">Select All</span>
              </template>
            </v-checkbox>
            <v-checkbox data-cy="none-checkbox" v-model="noneSelected" @change="clear" :style="{pointerEvents:noneCheckBoxPointerEvent}">
              <template v-slot:label>
                <span class="checkboxLabel">None</span>
              </template>
            </v-checkbox>
          </div>
          <div class="fieldCheckBoxeswrapper">
            <v-checkbox
              v-for="(field, index) in filteredFormFields"
              :input-value="selectedFields.get(field)"
              :key="field"
              :label="field"
              @change="onColumnsCheckBox($event,index,field)"
              style="padding:0px; margin:0px;">
              <template v-slot:label>
                <span class="checkboxLabel">{{field}}</span>
              </template>
            </v-checkbox>
          </div>
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn data-cy="columnPreferencesSaveBtn" class="mb-5 mr-5 saveButtonWrapper" color="primary" @click="saveColumns">
            <span>Save</span>
          </v-btn>
          <v-btn class="mb-5 cancelButtonWrapper" outlined @click="()=>{dialog = false; this.onSearchInputChange='';}">
            <span>Cancel</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core';

/* import specific icons */
import { faCircleInfo,faMagnifyingGlass, faCircleXmark} from '@fortawesome/free-solid-svg-icons';


/* add icons to the library */
library.add(faCircleInfo,faMagnifyingGlass,faCircleXmark);

export default {
  data() {
    return {
      dialog: false,
      loading: true,
      onSearchInputChange:'',
      selectedFields: new Map(),
      userSelectedColumns:[],
      noneSelected:true,
      selectedAll:false,
      filteredFormFields:[],
      noneCheckBoxPointerEvent:'none',
      selectAllPointerEvent:'auto',
      isClearButtonDisplay:'none',
      searchPlaceOrder:'Search form fields'

    };
  },
  computed: {
    ...mapGetters('form', ['form', 'formFields', 'userFormPreferences']),
    canSetColumnPrefs() {
      return this.form.versions && this.form.versions[0];
    },
    fileName() {
      return `${this.form.snake}_submissions.${this.exportFormat}`;
    },
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    ...mapActions('form', [
      'fetchFormFields',
      'updateFormPreferencesForCurrentUser',
    ]),

    //select all form fields checkboxes
    onSelectAllCheckboxChange(val) {
      this.noneSelected=false;
      this.selectAllPointerEvent='none';
      this.noneCheckBoxPointerEvent='auto';
      if (val) {
        this.setSelectALLCheckboxVModel(this.filteredFormFields,true);
      }
    },

    //used to set foem fields to either true or false
    setSelectALLCheckboxVModel(fields, value) {
      if(this.userFormPreferences&&this.userFormPreferences.preferences
        &&this.userFormPreferences.preferences.columns && this.userFormPreferences.preferences.columns.length>0) {
        for(const field of fields){
          this.userFormPreferences.preferences.columns.includes(field)
            ?this.selectedFields.set(field,true)
            :this.selectedFields.set(field,value);

        }
        this.checkAllCheckboxesChecked();
        this.noneSelected=false;
        this.noneCheckBoxPointerEvent='auto';
      }
      else {
        this.resetFormFieldValue(fields,value);
      }
    },

    //this method is called by both clear method and setSelectALLCheckboxVModel method
    // to uncheck all form fields checkboxes
    resetFormFieldValue(fields, value) {
      for(const field of fields){
        this.selectedFields.set(field,value);
      }
    },

    //check if all checkboxes are checked
    checkAllCheckboxesChecked() {
      let checker = Array.from(this.selectedFields.values()).every(v => v === true);
      if(checker) {
        this.selectedAll=true;
        this.selectAllPointerEvent='none';
      }
      else {
        this.selectedAll=false;
      }
      //
      return checker;
    },

    //called by none checkbox to uncheck all form fileds checkboxes
    clear() {
      this.selectAllPointerEvent='auto';
      this.noneCheckBoxPointerEvent='none';
      this.selectedAll=false;
      this.resetFormFieldValue(this.formFields,false);
    },

    // listen to each form fields checkbox checked/unchecked
    onColumnsCheckBox(value, index, column) {

      this.selectedFields.set(column,value);
      this.noneSelected=false;
      this.sortFields();
      if(this.checkAllCheckboxesChecked()){
        return;
      }
      this.selectedAll=false;
      this.selectAllPointerEvent='auto';
      this.noneCheckBoxPointerEvent='auto';
    },

    //clear search input
    onInputSearchClear(){
      this.onSearchInputChange='';

    },
    async openPrefs() {
      this.loading = true;
      this.dialog = true;
      await this.fetchFormFields({
        formId: this.form.id,
        formVersionId: this.form.versions[0].id,
      });
      this.loading = false;
    },
    async saveColumns() {
      this.userSelectedColumns=[];
      this.selectedFields.forEach((value,key)=>{
        if(value){
          this.userSelectedColumns.push(key);
        }
      });
      const userPrefs = {
        columns:Array.from(this.userSelectedColumns),
      };
      this.loading = true;
      await this.updateFormPreferencesForCurrentUser({
        formId: this.form.id,
        preferences: userPrefs,
      });
      // Update the parent if the note was updated
      this.$emit('preferences-saved');
      this.dialog = false;
    },
    // Selected fields should be top stacked
    async sortFields() {
      this.filteredFormFields = [...this.selectedFields.entries()].sort((a, b) =>b[1] - a[1]).map(row=>row[0]);
    }
  },
  watch: {
    onSearchInputChange(value) {
      this.filteredFormFields=[...this.formFields];
      this.isClearButtonDisplay='none';
      this.selectedAll=false;
      this.selectAllPointerEvent='auto';
      if(value) {
        this.isClearButtonDisplay='block';
        this.filteredFormFields=[];
        this.filteredFormFields = this.formFields.filter(column=>column.toLowerCase()
          .startsWith(value.toLowerCase()));
      }
      else {
        this.sortFields();
      }
      this.checkAllCheckboxesChecked();
    },
    formFields(fields) {
      this.filteredFormFields=[...fields];
      this.setSelectALLCheckboxVModel(fields,false);
      this.sortFields();
    },
  },


};
</script>
<style lang="scss" scoped>

  .subTitleWrapper {
    font-style: normal !important;
    font-size: 18px !important;
    font-variant: normal !important;
    font-family: BCSans !important;
    font-weight: normal !important;
    color: #707070C1 !important;
    gap:10px !important;
    padding-bottom:0px !important;
    margin-bottom:0px !important;
  }

  .cancelButtonWrapper {
    width: 80px !important;
    background: #FFFFFF 0% 0% no-repeat padding-box !important;
    border: 1px solid #003366 !important;
    border-radius: 3px !important;
    text-align: left !important;
    font-style: normal !important;
    font-size: 18px !important;
    font-variant: normal !important;
    font-family: BCSans !important;
    font-weight: normal !important;
    letter-spacing: 0px !important;
    color: #38598A !important;
    text-transform: capitalize !important;
  }

  .saveButtonWrapper {
    width: 80px !important;
    border: 1px solid #707070 !important;
    background: #003366 0% 0% no-repeat padding-box !important;
    border-radius: 3px !important;
    text-align: left !important;
    font-style: normal !important;
    font-size: 18px !important;
    font-variant: normal !important;
    font-family: BCSans !important;
    font-weight: normal !important;
    letter-spacing: 0px !important;
    color: #FFFFFF !important;
    text-transform: capitalize !important;
  }

  .titleWrapper {
    text-align: left !important;
    font-style: normal !important;
    font-size: 22px !important;
    font-weight: bold !important;
    font-variant: normal !important;
    font-family: BCSans !important;
    color: #000000 !important;
  }

  .checkboxLabel{
    text-align: left !important;
    font-style: normal !important;
    font-size: 16px !important;
    font-weight: normal !important;
    font-variant: normal !important;
    font-family: BCSans !important;
    text-transform: capitalize !important;
    letter-spacing: 0px !important;
    color: #313132 !important;
  }

  .searchField{
    background: #60606014 0% 0% no-repeat padding-box !important;
    border-radius: 4px !important;
    width:50% !important;
    height:35px !important;
    gap:10px !important;
    padding:3px !important;
    padding-left:15px !important;
    text-align: left !important;
    font-style: normal !important;
    font-size: 18px !important;
    font-weight: 300 !important;
    font-variant: normal !important;
    font-family: BCSans !important;
    letter-spacing: 0px !important;
    color: #606060 !important;
  }
  .searchField input:focus{
    outline: none !important;

  }

  .searchField input:focus::placeholder { color:transparent;outline: none !important; }

    /* Mozilla Firefox 4 to 18 */
  .searchField input:focus:-moz-placeholder { color:transparent; outline: none !important; }

    /* Mozilla Firefox 19+ */
  .searchField input:focus::-moz-placeholder { color:transparent; outline: none !important;}

    /* Internet Explorer 10+ */
  .searchField input:focus:-ms-input-placeholder { color:transparent;outline: none !important; }

  .searchField input::placeholder {
    text-align: left !important;
    font-size: 18px !important;
    font-weight: normal !important;
    font-style:normal !important;
    font-variant: normal !important;
    font-family: BCSans !important;
    letter-spacing: 0px !important;
    color: #606060 !important;
    opacity: 1 !important;
  }
  .fieldCheckBoxeswrapper{
    background: #60606005 0% 0% no-repeat padding-box !important;
    border: 1px solid #7070703F !important;
    border-radius: 4px !important;
    opacity: 1 !important;
    height: 300px !important;
    max-height: 300px !important;
    padding: 20px !important;
    overflow-y: scroll !important;
  }
.clearButton:hover{
  cursor: pointer;
  color:orange;
}

</style>
