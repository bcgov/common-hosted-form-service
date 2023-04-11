<template>
  <v-card>
    <v-card-title class="text-h5 pb-0 titleWrapper">
      <slot name="filter-title"></slot>
    </v-card-title>
    <v-card-subtitle class="mt-1 d-flex subTitleWrapper"> </v-card-subtitle>
    <v-card-text class="mt-0 pt-0">
      <hr class="hr" />

      <div class="d-flex flex-row align-center" style="gap: 30px">
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
        class="grey lighten-5"
      >
      </v-data-table>
      <v-btn @click="savingFilterData" class="primary mt-3">{{
        inputSaveButtonText
      }}</v-btn>
      <v-btn @click="cancelFilterData" class="mt-3 ml-3 primary--text" outlined
        >Cancel</v-btn
      >
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'BaseFilter',
  props: {
    inputHeaders: {
      type: Array,
      default: () => [
        { text: 'Column Name', align: 'start', sortable: true, value: 'text' },
      ],
    },
    // The data you will be filtering with
    inputData: {
      type: Array,
      default: () => [
        { text: 'Example Text', value: 'exampleText1' },
        { text: 'Example Text 2', value: 'exampleText2' },
      ],
    },
    inputItemKey: {
      type: String,
      default: 'value',
    },
    inputFilterLabel: {
      type: String,
      default: '',
    },
    inputFilterPlaceholder: {
      type: String,
      default: 'Filter Placeholder Text',
    },
    inputSaveButtonText: {
      type: String,
      default: 'Filter',
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
      this.inputFilter = '';
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
.titleWrapper {
  text-align: left !important;
  font-style: normal !important;
  font-size: 22px !important;
  font-weight: bold !important;
  font-variant: normal !important;
  font-family: BCSans !important;
  color: #000000 !important;
}

.hr {
  height: 1px;
  border: none;
  background-color: #707070c1;
  margin-bottom: 0px;
}
</style>
