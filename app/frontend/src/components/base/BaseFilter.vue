<template>
  <v-card>
    <v-card-title class="text-h5 pb-0 titleWrapper">
      <slot name="filter-title"></slot>
    </v-card-title>
    <v-card-subtitle class="mt-1 d-flex subTitleWrapper"> </v-card-subtitle>
    <v-card-text class="mt-0 pt-0">
      <hr class="hr" />

      <div class="d-flex flex-row align-center" style="gap: 30px;">
        <v-text-field
          v-model="inputFilter"
          :label="inputFilterLabel"
          :placeholder="inputFilterPlaceholder"
          clearable
          color="primary"
          prepend-inner-icon="search"
          filled
          dense
          class="mt-3"
        >
        </v-text-field>
      </div>
      <v-data-table
        fixed-header
        show-select
        hide-default-footer
        height="300px"
        v-model="selectedData"
        :headers="inputHeaders"
        :items="inputData"
        :item-key="inputItemKey"
        :search="inputFilter"
        class="grey lighten-4"
      >
      </v-data-table>
      <v-btn @click="savingFilterData" class="primary mt-3">{{inputSaveButtonText}}</v-btn>
      <v-btn @click="cancelFilterData" class="mt-3 ml-3 primary--text" outlined>Cancel</v-btn>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'BaseFilter',
  props: {
    inputHeaders: {
      type: Array,
      default: () => [ { text: 'Column Name', align: 'start', sortable: true, value: 'text' }],
    },
    // The data you will be filtering with
    inputData: {
      type: Array,
      default: () => [ { text: 'Example Text', value: 'exampleText1' }, { text: 'Example Text 2', value: 'exampleText2' } ],
    },
    inputItemKey: {
      type: String,
      default: 'value'
    },
    inputFilterLabel: {
      type: String,
      default: ''
    },
    inputFilterPlaceholder: {
      type: String,
      default: 'Filter Placeholder Text',
    },
    inputSaveButtonText: {
      type: String,
      default: 'Filter'
    },
  },
  data() {
    return {
      selectedData: [],
      inputFilter: '',
    };
  },
  methods: {
    savingFilterData() {
      this.$emit('saving-filter-data', this.selectedData);
    },
    cancelFilterData() {
      this.$emit('cancel-filter-data');
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
  color: #707070c1 !important;
  gap: 10px !important;
  padding-bottom: 0px !important;
  margin-bottom: 0px !important;
}

.cancelButtonWrapper {
  width: 80px !important;
  background: #ffffff 0% 0% no-repeat padding-box !important;
  border: 1px solid #003366 !important;
  border-radius: 3px !important;
  text-align: left !important;
  font-style: normal !important;
  font-size: 18px !important;
  font-variant: normal !important;
  font-family: BCSans !important;
  font-weight: normal !important;
  letter-spacing: 0px !important;
  color: #38598a !important;
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
  color: #ffffff !important;
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

.checkboxLabel {
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

.searchField {
  background: #60606014 0% 0% no-repeat padding-box !important;
  border-radius: 4px !important;
  width: 50% !important;
  height: 35px !important;
  gap: 10px !important;
  padding: 3px !important;
  padding-left: 15px !important;
  text-align: left !important;
  font-style: normal !important;
  font-size: 18px !important;
  font-weight: 300 !important;
  font-variant: normal !important;
  font-family: BCSans !important;
  letter-spacing: 0px !important;
  color: #606060 !important;
}
.searchField input:focus {
  outline: none !important;
}

.searchField input:focus::placeholder {
  color: transparent;
  outline: none !important;
}

/* Mozilla Firefox 4 to 18 */
.searchField input:focus:-moz-placeholder {
  color: transparent;
  outline: none !important;
}

/* Mozilla Firefox 19+ */
.searchField input:focus::-moz-placeholder {
  color: transparent;
  outline: none !important;
}

/* Internet Explorer 10+ */
.searchField input:focus:-ms-input-placeholder {
  color: transparent;
  outline: none !important;
}

.searchField input::placeholder {
  text-align: left !important;
  font-size: 18px !important;
  font-weight: normal !important;
  font-style: normal !important;
  font-variant: normal !important;
  font-family: BCSans !important;
  letter-spacing: 0px !important;
  color: #606060 !important;
  opacity: 1 !important;
}
.fieldCheckBoxeswrapper {
  background: #60606005 0% 0% no-repeat padding-box !important;
  border: 1px solid #7070703f !important;
  border-radius: 4px !important;
  opacity: 1 !important;
  height: 300px !important;
  max-height: 300px !important;
  padding: 20px !important;
  overflow-y: scroll !important;
}
.clearButton:hover {
  cursor: pointer;
  color: orange;
}

.hr {
  height: 1px;
  border: none;
  background-color: #707070c1;
  margin-bottom: 0px;
}
</style>
