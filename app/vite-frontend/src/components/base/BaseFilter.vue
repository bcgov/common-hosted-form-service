<script>
import { i18n } from '~/internationalization';

export default {
  props: {
    inputHeaders: {
      type: Array,
      default: () => [
        {
          title: i18n.t('trans.baseFilter.columnName'),
          align: 'start',
          sortable: true,
          key: 'title',
        },
      ],
    },
    // The data you will be filtering with
    inputData: {
      type: Array,
      default: () => [
        { title: i18n.t('trans.baseFilter.exampleText'), key: 'exampleText1' },
        { title: i18n.t('trans.baseFilter.exampleText2'), key: 'exampleText2' },
      ],
    },
    // The default selected data
    preselectedData: {
      type: Array,
      default: () => [],
    },
    inputItemKey: {
      type: String,
      default: 'key',
    },
    inputFilterLabel: {
      type: String,
      default: '',
    },
    inputFilterPlaceholder: {
      type: String,
      default: i18n.t('trans.baseFilter.exampleText2'),
    },
    inputSaveButtonText: {
      type: String,
      default: i18n.t('trans.baseFilter.filter'),
    },
  },
  emits: ['saving-filter-data', 'cancel-filter-data'],
  data() {
    return {
      selectedData: this.preselectedData,
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
          variant="filled"
          density="compact"
          class="mt-3"
        >
        </v-text-field>
      </div>
      <v-data-table
        v-model="selectedData"
        fixed-header
        show-select
        hide-default-footer
        height="300px"
        :headers="inputHeaders"
        :items="inputData"
        :item-value="inputItemKey"
        :search="inputFilter"
        class="bg-grey-lighten-5"
      >
      </v-data-table>
      <v-btn class="bg-primary mt-3" @click="savingFilterData">{{
        inputSaveButtonText
      }}</v-btn>
      <v-btn
        class="mt-3 ml-3 text-primary"
        variant="outlined"
        @click="cancelFilterData"
        >{{ $t('trans.baseFilter.cancel') }}</v-btn
      >
    </v-card-text>
  </v-card>
</template>

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
